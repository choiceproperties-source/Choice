import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

const faqs = [
  {
    question: "How long does the application process take?",
    answer: "Our average approval time is just 48 hours. Once you submit your application with all required documents, we verify your information and connect you with the landlord. Most applicants hear back within 1-2 business days."
  },
  {
    question: "What documents do I need to apply?",
    answer: "Typically you'll need: valid government ID, proof of income (pay stubs or tax returns), employment verification, and references. Some landlords may have additional requirements which will be listed on the property page."
  },
  {
    question: "Is my personal information secure?",
    answer: "Absolutely. We use bank-level encryption to protect your data. Your personal information is never shared without your consent, and all landlord communications happen through our secure platform."
  },
  {
    question: "Can I apply if I have bad credit?",
    answer: "Yes! We work with landlords who understand that credit scores don't tell the whole story. Many of our properties are second-chance housing friendly. Be upfront about your situation and we'll help you find the right match."
  },
  {
    question: "How does the digital lease signing work?",
    answer: "Once approved, you'll receive your lease through our platform. Review all terms, ask questions if needed, and sign electronically from any device. Both you and the landlord sign digitally - no printing or scanning required."
  },
  {
    question: "What happens after I sign the lease?",
    answer: "After both parties sign, you'll receive move-in instructions through your tenant dashboard. This includes key pickup details, access codes, utility setup info, and a personalized move-in checklist."
  }
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 bg-muted/30 dark:bg-slate-800/50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div data-aos="fade-right">
            <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-4">
              Got Questions?
            </span>
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Everything you need to know about renting with Choice Properties. Can't find your answer? Reach out to our team.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Link href="/faq">
                <Button variant="outline" size="lg" data-testid="button-faq-view-all">
                  <HelpCircle className="mr-2 h-5 w-5" />
                  View All FAQs
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" data-testid="button-faq-contact">
                  Contact Support
                </Button>
              </Link>
            </div>
          </div>

          <div className="space-y-4" data-aos="fade-left">
            {faqs.map((faq, idx) => (
              <div 
                key={idx}
                className="bg-card rounded-xl border border-border overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                  className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left hover:bg-muted/50 transition-colors"
                  data-testid={`button-faq-${idx}`}
                >
                  <span className="font-semibold text-foreground">{faq.question}</span>
                  <ChevronDown 
                    className={`h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform ${
                      openIndex === idx ? 'rotate-180' : ''
                    }`} 
                  />
                </button>
                {openIndex === idx && (
                  <div className="px-6 pb-5">
                    <p className="text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
