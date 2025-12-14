import { Users, Home, Clock, Star } from 'lucide-react';

const stats = [
  { 
    icon: Users, 
    value: '500+', 
    label: 'Happy Tenants', 
    description: 'Families found their home' 
  },
  { 
    icon: Home, 
    value: '1,200+', 
    label: 'Properties Listed', 
    description: 'Verified nationwide listings' 
  },
  { 
    icon: Clock, 
    value: '48hrs', 
    label: 'Avg. Approval', 
    description: 'Fast application processing' 
  },
  { 
    icon: Star, 
    value: '4.9/5', 
    label: 'Tenant Rating', 
    description: 'Based on verified reviews' 
  },
];

export function StatisticsBanner() {
  return (
    <section className="py-16 bg-white dark:bg-slate-900 border-y border-border">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div 
                key={idx} 
                className="text-center group"
                data-aos="fade-up"
                data-aos-delay={idx * 100}
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                  <Icon className="h-7 w-7" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-lg font-semibold text-foreground mb-1">
                  {stat.label}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
