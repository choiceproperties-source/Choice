import { CheckCircle2, Users, Briefcase, GraduationCap, Heart, RefreshCw, Plane } from 'lucide-react';

const audiences = [
  { icon: Briefcase, label: "Working professionals" },
  { icon: Heart, label: "Families and single parents" },
  { icon: GraduationCap, label: "Students & First-time renters" },
  { icon: Plane, label: "Relocating individuals" },
  { icon: RefreshCw, label: "Renters rebuilding credit" },
  { icon: Users, label: "Second-chance housing seekers" }
];

export function WhoWeHelp() {
  return (
    <section className="py-24 bg-white dark:bg-slate-900">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div data-aos="fade-right">
            <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-4">
              For Everyone
            </span>
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-6">
              Who We Help
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              We specialize in matching renters with properties that fit their lifestyle, budget, and needs. 
              Wherever you are in the USA, Choice Properties is ready to pair you with a home that's right for you.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {audiences.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div 
                    key={idx} 
                    className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="relative" data-aos="fade-left">
            <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                alt="Happy family moving in" 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
            
            <div className="absolute -bottom-6 -left-6 bg-primary text-white p-6 rounded-xl shadow-xl hidden md:block">
              <p className="text-3xl font-bold">100%</p>
              <p className="text-sm font-semibold uppercase tracking-wider">Verified Listings</p>
            </div>
            
            <div className="absolute -top-6 -right-6 bg-secondary text-primary-foreground p-4 rounded-xl shadow-xl hidden md:block">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-bold">Second-Chance Friendly</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
