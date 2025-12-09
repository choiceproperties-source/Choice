import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import propertiesData from "@/data/properties.json";
import { CheckCircle2, AlertCircle, Upload, UserPlus, Trash2, FileText, ArrowRight, ArrowLeft, Shield, Clock, DollarSign, Home as HomeIcon, Loader2 } from "lucide-react";
import { Breadcrumb } from "@/components/breadcrumb";
import { trackFormCompletion } from "@/lib/pwa";
import { updateMetaTags } from "@/lib/seo";

const applySchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  currentAddress: z.string().min(5, "Current address is required"),
  
  prevAddress: z.string().optional(),
  prevLandlord: z.string().optional(),
  prevLandlordPhone: z.string().optional(),
  reasonForLeaving: z.string().optional(),
  
  employer: z.string().min(2, "Employer name is required"),
  position: z.string().min(2, "Position is required"),
  income: z.string().min(1, "Monthly income is required"),
  employmentLength: z.string().min(1, "Employment length is required"),
  
  reference1Name: z.string().optional(),
  reference1Phone: z.string().optional(),
  reference1Relationship: z.string().optional(),
  reference2Name: z.string().optional(),
  reference2Phone: z.string().optional(),
  reference2Relationship: z.string().optional(),
  
  hasPets: z.boolean().default(false),
  petDescription: z.string().optional(),
  smokingStatus: z.string().default("no"),
  numberOfOccupants: z.string().min(1, "Number of occupants is required"),
  criminalHistory: z.boolean().default(false),
  criminalDetails: z.string().optional(),
  
  moveInDate: z.string().min(1, "Move-in date is required"),
  
  agreeToBackgroundCheck: z.boolean().refine(val => val === true, "You must consent to background check"),
  agreeToTerms: z.boolean().refine(val => val === true, "You must agree to the terms"),
  signature: z.string().min(2, "Signature is required"),
});

type ApplyFormValues = z.infer<typeof applySchema>;

const steps = [
  { id: 1, label: "Personal Info" },
  { id: 2, label: "Rental History" },
  { id: 3, label: "Employment" },
  { id: 4, label: "References" },
  { id: 5, label: "Disclosures" },
  { id: 6, label: "Documents" },
  { id: 7, label: "Review & Sign" }
];

export default function Apply() {
  useEffect(() => {
    updateMetaTags({
      title: "Apply for Rental - Choice Properties",
      description: "Start your rental application with Choice Properties. Quick, easy, and secure."
    });
  }, []);

  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const propertyId = searchParams.get("propertyId");
  const property = propertiesData.find(p => p.id === propertyId);
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{name: string, type: string}>>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const form = useForm<ApplyFormValues>({
    resolver: zodResolver(applySchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      currentAddress: "",
      prevAddress: "",
      prevLandlord: "",
      prevLandlordPhone: "",
      reasonForLeaving: "",
      employer: "",
      position: "",
      income: "",
      employmentLength: "",
      reference1Name: "",
      reference1Phone: "",
      reference1Relationship: "",
      reference2Name: "",
      reference2Phone: "",
      reference2Relationship: "",
      hasPets: false,
      petDescription: "",
      smokingStatus: "no",
      numberOfOccupants: "1",
      criminalHistory: false,
      criminalDetails: "",
      moveInDate: "",
      agreeToBackgroundCheck: false,
      agreeToTerms: false,
      signature: "",
    },
    mode: "onChange"
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setUploadedFiles(prev => [...prev, { name: file.name, type: file.type }]);
      toast({
        title: "File Uploaded",
        description: `${file.name} has been added to your application.`
      });
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    
    if (currentStep === 1) {
      fieldsToValidate = ["firstName", "lastName", "email", "phone", "dateOfBirth", "currentAddress"];
    } else if (currentStep === 3) {
      fieldsToValidate = ["employer", "position", "income", "employmentLength", "moveInDate"];
    } else if (currentStep === 5) {
      fieldsToValidate = ["numberOfOccupants"];
      if (form.getValues("hasPets")) {
        fieldsToValidate.push("petDescription");
      }
      if (form.getValues("criminalHistory")) {
        fieldsToValidate.push("criminalDetails");
      }
    } else if (currentStep === 7) {
      fieldsToValidate = ["agreeToBackgroundCheck", "agreeToTerms", "signature"];
    }

    const isValid = fieldsToValidate.length === 0 || await form.trigger(fieldsToValidate);
    
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, 7));
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  const onSubmit = (data: ApplyFormValues) => {
    setIsProcessing(true);
    
    // Save application to localStorage
    const applications = JSON.parse(localStorage.getItem('choiceProperties_applications') || '[]');
    const newApplication = {
      id: applications.length + 1,
      property_title: property?.title || 'Unknown Property',
      property_id: propertyId || '',
      property_price: property?.price || 0,
      property_address: property?.address || '',
      user_name: `${data.firstName} ${data.lastName}`,
      user_email: data.email,
      user_phone: data.phone,
      application_fee: property?.application_fee || 0,
      submitted_at: new Date().toISOString(),
      status_updated_at: new Date().toISOString(),
      status: 'pending',
      notes: '',
      formData: data,
      files: uploadedFiles
    };
    
    applications.push(newApplication);
    localStorage.setItem('choiceProperties_applications', JSON.stringify(applications));
    
    console.log("Application Submitted:", newApplication);
    
    setTimeout(() => {
      setIsProcessing(false);
      setIsSubmitted(true);
      window.scrollTo(0, 0);
    }, 2000);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4 bg-muted/20">
          <Card className="max-w-2xl w-full border-t-4 border-t-green-500 shadow-2xl">
            <CardContent className="p-10">
              <div className="text-center">
                <div className="w-24 h-24 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 dark:text-green-400 animate-in zoom-in duration-500">
                  <CheckCircle2 className="h-12 w-12" />
                </div>
                <h2 className="text-3xl font-bold text-primary mb-4">Application Submitted Successfully!</h2>
                <p className="text-muted-foreground text-lg mb-8">
                  Thank you for applying{property ? ` for ${property.title}` : ''}. Your application has been received and is now being reviewed.
                </p>

                <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8 text-left">
                  <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    What Happens Next?
                  </h3>
                  <ul className="space-y-3 text-blue-800 dark:text-blue-200">
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 dark:bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                      <span><strong>Email Confirmation:</strong> You'll receive a confirmation email within 5 minutes with your application reference number.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 dark:bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                      <span><strong>Application Review:</strong> Our team will review your application within 24-48 hours.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 dark:bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                      <span><strong>Background Verification:</strong> We'll process your background check and employment verification.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 dark:bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                      <span><strong>Decision Notification:</strong> You'll hear back from us with a decision via email and phone.</span>
                    </li>
                  </ul>
                </div>

                {property && (
                  <div className="bg-muted/50 p-6 rounded-lg mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      <h4 className="font-bold text-primary">Application Fee: ${property.application_fee}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">This fee will be charged upon approval and covers the background check and processing.</p>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button onClick={() => setLocation("/")} variant="outline" className="flex-1 h-12 text-lg font-bold">
                    Return Home
                  </Button>
                  <Button onClick={() => setLocation("/properties")} className="flex-1 bg-primary h-12 text-lg font-bold">
                    Browse More Properties
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // Calculate progress percentage
  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;
  const estimatedMinutes = Math.ceil((7 - currentStep + 1) * 2);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <div className="bg-gradient-to-r from-primary to-secondary text-white py-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full transform translate-x-10 -translate-y-10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="max-w-3xl">
              <h1 className="font-heading text-3xl font-bold mb-2 flex items-center gap-3">
                <FileText className="h-8 w-8 text-accent" />
                Rental Application
              </h1>
              <p className="text-white/90">
                {property 
                  ? `Applying for: ${property.title} - $${property.price.toLocaleString()}/mo`
                  : "Complete the form below to apply for a property."}
              </p>
              <div className="mt-4 flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4" />
                <span>Est. time: {estimatedMinutes} mins remaining</span>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" /> Est. time: 10-15 mins
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-950 border-b sticky top-16 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="relative mb-2">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
            <div className="flex justify-between text-xs font-medium text-muted-foreground">
              {steps.map((step) => (
                <span 
                  key={step.id} 
                  className={`${currentStep >= step.id ? "text-primary font-bold" : ""} transition-colors hidden md:block`}
                >
                  {step.label}
                </span>
              ))}
              <span className="md:hidden text-primary font-bold">
                Step {currentStep} of {steps.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 flex-1 bg-muted/10">
        <div className="max-w-4xl mx-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {currentStep === 1 && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                      <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">1</span>
                      Personal Information
                    </CardTitle>
                    <CardDescription>Tell us about yourself. All fields are required.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="john@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="(707) 706-3137" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currentAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Address <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Textarea placeholder="123 Main St, City, State, Zip" {...field} />
                          </FormControl>
                          <FormDescription>Include street, city, state, and zip code</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="justify-end pt-6 border-t bg-muted/5">
                    <Button type="button" onClick={nextStep} className="bg-secondary hover:bg-secondary/90 text-primary-foreground font-bold">
                      Next Step <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              )}

              {currentStep === 2 && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                      <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">2</span>
                      Rental History
                    </CardTitle>
                    <CardDescription>Tell us about your previous rental experience (optional but recommended).</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="prevAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Previous Address</FormLabel>
                          <FormControl>
                            <Textarea placeholder="456 Previous St, City, State, Zip" {...field} />
                          </FormControl>
                          <FormDescription>Your last rental address</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="prevLandlord"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Previous Landlord Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Property Manager Name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="prevLandlordPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Previous Landlord Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="(555) 987-6543" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="reasonForLeaving"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reason for Leaving</FormLabel>
                          <FormControl>
                            <Textarea placeholder="E.g., Job relocation, needed larger space, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="justify-between pt-6 border-t bg-muted/5">
                    <Button type="button" variant="outline" onClick={prevStep}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Button type="button" onClick={nextStep} className="bg-secondary hover:bg-secondary/90 text-primary-foreground font-bold">
                      Next Step <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              )}

              {currentStep === 3 && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                      <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">3</span>
                      Employment & Income
                    </CardTitle>
                    <CardDescription>Help us verify your income and employment.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="employer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Employer <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="Company Name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="position"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Position/Job Title <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="Software Engineer" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="income"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Monthly Income ($) <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="5000" type="number" {...field} />
                            </FormControl>
                            <FormDescription>Before taxes</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="employmentLength"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Employment Length <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="2 years" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="moveInDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Desired Move-in Date <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 items-start">
                      <Shield className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                      <div className="text-sm text-blue-900">
                        <p className="font-semibold mb-1">Income Verification</p>
                        <p>You'll be asked to upload paystubs or proof of income in a later step. This helps expedite your application.</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="justify-between pt-6 border-t bg-muted/5">
                    <Button type="button" variant="outline" onClick={prevStep}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Button type="button" onClick={nextStep} className="bg-secondary hover:bg-secondary/90 text-primary-foreground font-bold">
                      Next Step <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              )}

              {currentStep === 4 && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                      <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">4</span>
                      Personal References
                    </CardTitle>
                    <CardDescription>Provide contact information for personal references (optional but recommended).</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-primary" />
                        Reference 1
                      </h4>
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="reference1Name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Jane Smith" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="reference1Phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                  <Input placeholder="(555) 111-2222" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="reference1Relationship"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Relationship</FormLabel>
                                <FormControl>
                                  <Input placeholder="Friend, Colleague, etc." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-primary" />
                        Reference 2
                      </h4>
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="reference2Name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Bob Johnson" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="reference2Phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                  <Input placeholder="(555) 333-4444" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="reference2Relationship"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Relationship</FormLabel>
                                <FormControl>
                                  <Input placeholder="Family, Coworker, etc." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="justify-between pt-6 border-t bg-muted/5">
                    <Button type="button" variant="outline" onClick={prevStep}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Button type="button" onClick={nextStep} className="bg-secondary hover:bg-secondary/90 text-primary-foreground font-bold">
                      Next Step <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              )}

              {currentStep === 5 && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                      <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">5</span>
                      Additional Disclosures
                    </CardTitle>
                    <CardDescription>Please answer the following questions honestly.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="numberOfOccupants"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Occupants <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input type="number" min="1" placeholder="1" {...field} />
                          </FormControl>
                          <FormDescription>Including yourself, how many people will live in the property?</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    <FormField
                      control={form.control}
                      name="hasPets"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-muted/20">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Do you have pets?</FormLabel>
                            <FormDescription>
                              If yes, please provide details below
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {form.watch("hasPets") && (
                      <FormField
                        control={form.control}
                        name="petDescription"
                        render={({ field }) => (
                          <FormItem className="animate-in fade-in slide-in-from-top-2">
                            <FormLabel>Pet Details</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Type (dog/cat), breed, weight, age, and any other relevant information" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <Separator />

                    <FormField
                      control={form.control}
                      name="smokingStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Smoking Status</FormLabel>
                          <FormControl>
                            <select 
                              className="w-full p-2 border rounded-md bg-background"
                              {...field}
                            >
                              <option value="no">Non-smoker</option>
                              <option value="outside">Smoke outside only</option>
                              <option value="yes">Yes, I smoke</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    <FormField
                      control={form.control}
                      name="criminalHistory"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start justify-between rounded-lg border p-4 bg-muted/20">
                          <div className="space-y-0.5 flex-1 pr-4">
                            <FormLabel className="text-base">Criminal History Disclosure</FormLabel>
                            <FormDescription>
                              Have you ever been convicted of a felony or misdemeanor? (Disclosure is required by law and does not automatically disqualify you)
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {form.watch("criminalHistory") && (
                      <FormField
                        control={form.control}
                        name="criminalDetails"
                        render={({ field }) => (
                          <FormItem className="animate-in fade-in slide-in-from-top-2">
                            <FormLabel>Please Explain</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Brief description of the conviction and date" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>This information is confidential and will only be reviewed by authorized personnel.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </CardContent>
                  <CardFooter className="justify-between pt-6 border-t bg-muted/5">
                    <Button type="button" variant="outline" onClick={prevStep}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Button type="button" onClick={nextStep} className="bg-secondary hover:bg-secondary/90 text-primary-foreground font-bold">
                      Next Step <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              )}

              {currentStep === 6 && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                      <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">6</span>
                      Document Upload
                    </CardTitle>
                    <CardDescription>Please upload proof of income and identification.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:bg-muted/10 transition-colors cursor-pointer relative">
                      <input 
                        type="file" 
                        onChange={handleFileUpload} 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        accept=".pdf,.jpg,.jpeg,.png"
                        multiple
                      />
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center text-secondary">
                          <Upload className="h-8 w-8" />
                        </div>
                        <h4 className="font-semibold text-lg">Click or drag files to upload</h4>
                        <p className="text-muted-foreground text-sm max-w-md mx-auto">
                          PDF, JPG, or PNG files. Max 5MB each.
                        </p>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">Required Documents:</h4>
                      <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                        <li>Government-issued photo ID (Driver's License, Passport, or State ID)</li>
                        <li>Proof of income (Recent pay stubs, bank statements, or tax returns)</li>
                        <li>Letter of employment (optional but recommended)</li>
                      </ul>
                    </div>

                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Uploaded Files ({uploadedFiles.length})</h4>
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted/20 rounded-md">
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-primary" />
                              <span className="text-sm font-medium truncate max-w-[250px]">{file.name}</span>
                              <span className="text-xs text-muted-foreground uppercase border px-1 rounded">{file.type.split('/')[1] || 'FILE'}</span>
                            </div>
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => removeFile(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg flex gap-3 items-start">
                      <Shield className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                      <div className="text-sm text-green-900">
                        <p className="font-semibold mb-1">Secure & Encrypted</p>
                        <p>Your documents are encrypted and stored securely. We only share this information with the property management team for verification purposes.</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="justify-between pt-6 border-t bg-muted/5">
                    <Button type="button" variant="outline" onClick={prevStep}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Button type="button" onClick={nextStep} className="bg-secondary hover:bg-secondary/90 text-primary-foreground font-bold">
                      Next Step <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              )}

              {currentStep === 7 && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                      <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">7</span>
                      Review & Signature
                    </CardTitle>
                    <CardDescription>Review your information and sign to submit your application.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-muted/30 p-6 rounded-lg space-y-4">
                      <h3 className="font-bold text-lg">Application Summary</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Applicant Name</p>
                          <p className="font-semibold">{form.watch("firstName")} {form.watch("lastName")}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Email</p>
                          <p className="font-semibold">{form.watch("email")}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Monthly Income</p>
                          <p className="font-semibold">${form.watch("income")}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Move-in Date</p>
                          <p className="font-semibold">{form.watch("moveInDate") || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Employer</p>
                          <p className="font-semibold">{form.watch("employer")}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Documents Uploaded</p>
                          <p className="font-semibold">{uploadedFiles.length} file(s)</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <FormField
                      control={form.control}
                      name="agreeToBackgroundCheck"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="font-semibold">
                              Background Check Consent <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormDescription>
                              I authorize Choice Properties and the property owner to conduct a background check, credit check, and verify my employment and rental history. I understand this may include criminal records, eviction records, and credit reports.
                            </FormDescription>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="agreeToTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="font-semibold">
                              Terms and Conditions <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormDescription>
                              I certify that all information provided in this application is true and accurate. I understand that false information may result in denial of my application or termination of my lease. I have read and agree to the{' '}
                              <Link href="/terms" className="text-primary underline">Terms & Conditions</Link> and{' '}
                              <Link href="/privacy" className="text-primary underline">Privacy Policy</Link>.
                            </FormDescription>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="signature"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Electronic Signature <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Type your full name as signature" 
                              {...field} 
                              className="font-serif text-lg"
                            />
                          </FormControl>
                          <FormDescription>
                            By typing your name, you agree that this constitutes a legal signature confirming that all information is accurate and complete.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {property && (
                      <div className="bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg flex gap-3 items-start">
                        <DollarSign className="h-5 w-5 text-yellow-700 dark:text-yellow-400 mt-0.5 shrink-0" />
                        <div className="text-sm text-yellow-900 dark:text-yellow-100">
                          <p className="font-semibold mb-1">Application Fee: ${property.application_fee}</p>
                          <p>Upon approval, a ${property.application_fee} application fee will be charged to cover background check and processing costs.</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="justify-between pt-6 border-t bg-muted/5">
                    <Button type="button" variant="outline" onClick={prevStep} disabled={isProcessing}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-bold px-8"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="animate-spin mr-2 h-4 w-4" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          Submit Application <CheckCircle2 className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              )}

            </form>
          </Form>
        </div>
      </div>

      <Footer />
    </div>
  );
}
