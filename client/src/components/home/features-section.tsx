import { CheckCircle2, ShieldCheck, Home, MapPin, FileSignature, CreditCard } from 'lucide-react';

const features = [
  {
    icon: CheckCircle2,
    title: "Verified Listings",
    description: "Every property is verified and legitimate. No scams, no surprises - just quality homes you can trust."
  },
  {
    icon: ShieldCheck,
    title: "Secure Platform",
    description: "Your information stays safe with our encrypted platform. Protected renter-landlord interactions."
  },
  {
    icon: Home,
    title: "All Property Types",
    description: "Houses, apartments, condos, townhomes. Find exactly what you're looking for in one place."
  },
  {
    icon: MapPin,
    title: "Nationwide Access",
    description: "Rental properties available nationwide. Find your perfect match wherever life takes you."
  },
  {
    icon: FileSignature,
    title: "Digital Lease Signing",
    description: "Sign your lease electronically from anywhere. No printing, no scanning, no hassle."
  },
  {
    icon: CreditCard,
    title: "Easy Rent Payments",
    description: "Set up automatic payments and track your payment history. Landlords verify instantly."
  }
];

export function FeaturesSection() {
  return (
    <section className="py-24 bg-white dark:bg-slate-900">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16" data-aos="fade-up">
          <span className="inline-block px-4 py-2 bg-secondary/10 text-secondary rounded-full text-sm font-semibold mb-4">
            Why Choose Us
          </span>
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-6">
            Everything You Need to Find Your Home
          </h2>
          <p className="text-muted-foreground text-lg">
            We connect renters with verified properties and guide you through every step of the rental process.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div 
                key={idx} 
                className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/30 shadow-sm hover:shadow-xl transition-all duration-300"
                data-aos="fade-up"
                data-aos-delay={idx * 50}
              >
                <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 w-fit group-hover:from-primary/20 group-hover:to-secondary/20 transition-colors">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-heading text-xl font-bold mb-3 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
