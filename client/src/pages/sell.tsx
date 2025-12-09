import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Home, DollarSign, FileText } from "lucide-react";

export default function Sell() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    propertyType: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    bedrooms: '',
    bathrooms: '',
    sqft: '',
    yearBuilt: '',
    askingPrice: '',
    description: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4 bg-muted/20">
          <Card className="max-w-2xl w-full border-t-4 border-t-green-500 shadow-2xl">
            <CardContent className="p-10">
              <div className="text-center">
                <div className="w-24 h-24 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-12 w-12" />
                </div>
                <h2 className="text-3xl font-bold text-primary mb-4">Listing Submitted!</h2>
                <p className="text-muted-foreground text-lg mb-8">
                  Your property listing has been submitted. Our team will review it and contact you within 24 hours to activate your listing.
                </p>
                <Button onClick={() => window.location.href = '/'} className="bg-primary">
                  Return to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="bg-gradient-to-r from-primary to-secondary text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Home className="h-8 w-8" />
            List Your Property
          </h1>
          <p className="text-white/90">Sell or rent your property to thousands of buyers and renters</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 flex-1">
        <div className="max-w-3xl mx-auto">
          {/* Step Indicator */}
          <div className="mb-12 flex gap-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1">
                <div className={`h-2 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`} />
                <p className="text-xs font-semibold mt-2">{s === 1 ? 'Property Type' : s === 2 ? 'Details' : 'Pricing'}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Step 1: Property Type */}
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Property Details</CardTitle>
                  <CardDescription>Tell us about your property</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="font-semibold mb-2 block">Property Type</label>
                    <select 
                      name="propertyType"
                      value={formData.propertyType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border rounded-lg bg-background dark:border-gray-700"
                      required
                    >
                      <option value="">Select type...</option>
                      <option value="house">House</option>
                      <option value="apartment">Apartment</option>
                      <option value="townhouse">Townhouse</option>
                      <option value="condo">Condo</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="font-semibold mb-2 block">Bedrooms</label>
                      <Input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleInputChange} required />
                    </div>
                    <div>
                      <label className="font-semibold mb-2 block">Bathrooms</label>
                      <Input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleInputChange} required />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Address */}
            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                  <CardDescription>Where is your property located?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="Street Address" name="address" value={formData.address} onChange={handleInputChange} required />
                  <div className="grid grid-cols-2 gap-4">
                    <Input placeholder="City" name="city" value={formData.city} onChange={handleInputChange} required />
                    <Input placeholder="State" name="state" value={formData.state} onChange={handleInputChange} required />
                  </div>
                  <Input placeholder="Zip Code" name="zip" value={formData.zip} onChange={handleInputChange} required />
                </CardContent>
              </Card>
            )}

            {/* Step 3: Pricing */}
            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Pricing & Description
                  </CardTitle>
                  <CardDescription>Set your listing price and details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="font-semibold mb-2 block">Asking Price ($)</label>
                    <Input type="number" name="askingPrice" value={formData.askingPrice} onChange={handleInputChange} placeholder="500000" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input type="number" placeholder="Square Footage" name="sqft" value={formData.sqft} onChange={handleInputChange} />
                    <Input type="number" placeholder="Year Built" name="yearBuilt" value={formData.yearBuilt} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label className="font-semibold mb-2 block">Description</label>
                    <Textarea placeholder="Describe your property..." name="description" value={formData.description} onChange={handleInputChange} rows={4} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-4">
              <Button 
                type="button"
                variant="outline"
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
              >
                Previous
              </Button>
              {step < 3 ? (
                <Button 
                  type="button"
                  onClick={() => setStep(step + 1)}
                >
                  Next
                </Button>
              ) : (
                <Button type="submit" className="bg-primary">
                  Submit Listing
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}
