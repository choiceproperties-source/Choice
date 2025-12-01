import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Breadcrumb } from "@/components/breadcrumb";
import { trackFormCompletion } from "@/lib/pwa";
import { updateMetaTags } from "@/lib/seo";

export default function Contact() {
  useEffect(() => {
    updateMetaTags({
      title: "Contact Us - Choice Properties",
      description: "Get in touch with Choice Properties. Fill out our contact form and we'll be in touch soon."
    });
  }, []);

  const { toast } = useToast();
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields before submitting.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");

    setTimeout(() => {
      const messages = JSON.parse(localStorage.getItem("choiceProperties_messages") || "[]");
      const newMessage = {
        ...formData,
        id: Date.now(),
        timestamp: new Date().toISOString()
      };
      messages.push(newMessage);
      localStorage.setItem("choiceProperties_messages", JSON.stringify(messages));
      trackFormCompletion("contact", true);
      
      setSubmitStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
      setIsSubmitting(false);

      toast({
        title: "Message Sent!",
        description: "We'll get back to you as soon as possible."
      });

      setTimeout(() => setSubmitStatus("idle"), 5000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <Breadcrumb items={[{ label: "Contact" }]} />
      
      <div className="bg-primary py-16 text-center">
        <h1 className="font-heading text-4xl font-bold text-white mb-4" data-aos="zoom-in">Contact Us</h1>
        <p className="text-primary-foreground/80 max-w-xl mx-auto px-4" data-aos="fade-up" data-aos-delay="200">
          We're here to help. Reach out to us for any inquiries or support.
        </p>
      </div>

      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <div className="space-y-8" data-aos="fade-up">
            <Card className={submitStatus === "success" ? "border-green-200 bg-green-50" : ""}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>Send us a Message</CardTitle>
                  {submitStatus === "success" && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {submitStatus === "success" ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-green-900 mb-2">Message Sent Successfully!</h3>
                    <p className="text-green-800 mb-4">Thank you for contacting us. We'll respond within 24 hours.</p>
                    <Button onClick={() => setSubmitStatus("idle")} variant="outline">Send Another Message</Button>
                  </div>
                ) : (
                  <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input 
                          id="name" 
                          placeholder="Your Name" 
                          value={formData.name}
                          onChange={handleChange}
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="your@email.com" 
                          value={formData.email}
                          onChange={handleChange}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input 
                        id="subject" 
                        placeholder="How can we help?" 
                        value={formData.subject}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea 
                        id="message" 
                        placeholder="Your message..." 
                        className="min-h-[150px]" 
                        value={formData.message}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      />
                    </div>

                    <Button 
                      type="submit"
                      className="w-full bg-primary text-white font-bold h-12 hover:bg-primary/90" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Sending...
                        </>
                      ) : (
                        "Send Message"
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
