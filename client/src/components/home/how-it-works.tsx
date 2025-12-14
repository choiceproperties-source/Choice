import { Search, FileText, CheckSquare, Key, ArrowRight } from 'lucide-react';

const steps = [
  { 
    step: 1, 
    icon: Search, 
    title: "Search Properties", 
    desc: "Browse verified listings by location, price, and bedrooms. Filter to find your perfect match.",
    color: "bg-blue-500"
  },
  { 
    step: 2, 
    icon: FileText, 
    title: "Apply Online", 
    desc: "Submit your application with all required documents. Our secure platform protects your data.",
    color: "bg-purple-500"
  },
  { 
    step: 3, 
    icon: CheckSquare, 
    title: "Get Approved", 
    desc: "We verify your information and connect you with the landlord. Average approval in 48 hours.",
    color: "bg-green-500"
  },
  { 
    step: 4, 
    icon: Key, 
    title: "Move In", 
    desc: "Sign your lease digitally, get your keys, and move into your new home. It's that simple!",
    color: "bg-secondary"
  }
];

export function HowItWorks() {
  return (
    <section className="py-24 bg-muted/30 dark:bg-slate-800/50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16" data-aos="fade-up">
          <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-4">
            Simple Process
          </span>
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-6">
            How It Works
          </h2>
          <p className="text-muted-foreground text-lg">
            From search to move-in, we've simplified the entire rental process into four easy steps.
          </p>
        </div>

        <div className="relative">
          <div className="hidden md:block absolute top-24 left-[12%] right-[12%] h-1 bg-gradient-to-r from-blue-500 via-purple-500 via-green-500 to-secondary rounded-full" />
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div 
                  key={idx} 
                  className="relative"
                  data-aos="fade-up"
                  data-aos-delay={idx * 100}
                >
                  <div className="text-center">
                    <div className={`mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full ${item.color} text-white shadow-lg relative z-10`}>
                      <Icon className="h-10 w-10" />
                    </div>
                    <div className="bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-lg transition-shadow">
                      <span className="inline-block text-xs font-bold text-muted-foreground mb-2">
                        STEP {item.step}
                      </span>
                      <h3 className="font-heading text-xl font-bold text-foreground mb-3">
                        {item.title}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                  {idx < 3 && (
                    <div className="hidden md:flex absolute top-24 -right-4 z-20 items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-slate-900 border-2 border-border">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
