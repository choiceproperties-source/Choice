import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { ArrowRight, Phone, Mail } from 'lucide-react';

export function CTASection() {
  return (
    <section className="py-24 bg-gradient-to-br from-primary via-primary to-blue-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMCAwdi02aC02djZoNnptLTYgMGgtNnY2aDZ2LTZ6bTAgMHYtNmgtNnY2aDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
      
      <div className="container mx-auto px-4 text-center relative z-10">
        <div data-aos="zoom-in" className="max-w-4xl mx-auto">
          <span className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-6 border border-white/20">
            Ready to Find Your Home?
          </span>
          <h2 className="font-heading text-4xl md:text-6xl font-bold mb-6">
            Your next rental starts{' '}
            <span className="text-secondary">here.</span>
          </h2>
          <p className="text-white/80 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            We don't just list properties—we guide you through the entire process. 
            From viewing a home to getting your keys, we're with you every step of the way.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/properties">
              <Button size="lg" className="bg-secondary text-primary-foreground font-bold h-16 px-12 text-lg shadow-lg group" data-testid="button-cta-search">
                Start Searching Now
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-2 border-white/30 text-white font-bold h-16 px-12 text-lg backdrop-blur-sm" data-testid="button-cta-agent">
                Talk to an Agent
              </Button>
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row gap-8 justify-center text-white/70">
            <a href="tel:+1234567890" className="flex items-center gap-2 hover:text-white transition-colors" data-testid="link-cta-phone">
              <Phone className="h-5 w-5" />
              <span>(123) 456-7890</span>
            </a>
            <a href="mailto:hello@choiceproperties.com" className="flex items-center gap-2 hover:text-white transition-colors" data-testid="link-cta-email">
              <Mail className="h-5 w-5" />
              <span>hello@choiceproperties.com</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
