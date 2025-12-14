import { CheckCircle2, Circle, Clock, FileText, Key, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

const timelineSteps = [
  { status: 'completed', label: 'Application Submitted', icon: FileText },
  { status: 'completed', label: 'Application Approved', icon: CheckCircle2 },
  { status: 'current', label: 'Lease Signing', icon: FileText },
  { status: 'pending', label: 'Move-In Ready', icon: Key },
  { status: 'pending', label: 'Welcome Home', icon: Home },
];

export function LeaseDashboardPreview() {
  return (
    <section className="py-24 bg-gradient-to-br from-primary via-primary to-blue-900 text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMCAwdi02aC02djZoNnptLTYgMGgtNnY2aDZ2LTZ6bTAgMHYtNmgtNnY2aDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div data-aos="fade-right">
            <span className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-6 border border-white/20">
              Tenant Dashboard
            </span>
            <h2 className="font-heading text-3xl md:text-5xl font-bold mb-6">
              Track Your Lease Journey in Real-Time
            </h2>
            <p className="text-lg text-white/80 mb-8 leading-relaxed">
              From application to move-in, see exactly where you are in the process. Our tenant dashboard keeps you informed every step of the way.
            </p>
            
            <ul className="space-y-4 mb-10">
              {[
                "Real-time status updates",
                "Digital lease signing",
                "Move-in checklist & instructions",
                "Direct landlord communication",
                "Payment tracking & history"
              ].map((item, idx) => (
                <li key={idx} className="flex items-center text-lg font-medium">
                  <CheckCircle2 className="h-6 w-6 text-secondary mr-3 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <Link href="/signup">
              <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-primary-foreground font-bold h-14 px-8">
                Create Your Account
              </Button>
            </Link>
          </div>

          <div className="relative" data-aos="fade-left">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-2xl">
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Home className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg">Sunset Ridge Apartment</h3>
                  <p className="text-sm text-muted-foreground">2 BR | 1,200 sqft | $1,850/mo</p>
                </div>
              </div>

              <div className="space-y-6">
                {timelineSteps.map((step, idx) => {
                  const Icon = step.icon;
                  return (
                    <div key={idx} className="flex items-center gap-4">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        step.status === 'completed' ? 'bg-green-500 text-white' :
                        step.status === 'current' ? 'bg-primary text-white animate-pulse' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {step.status === 'completed' ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : step.status === 'current' ? (
                          <Clock className="h-5 w-5" />
                        ) : (
                          <Circle className="h-5 w-5" />
                        )}
                      </div>
                      <div className={`flex-1 ${step.status === 'pending' ? 'opacity-50' : ''}`}>
                        <p className={`font-medium ${
                          step.status === 'current' ? 'text-primary' : 'text-foreground'
                        }`}>
                          {step.label}
                        </p>
                      </div>
                      {step.status === 'current' && (
                        <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                          In Progress
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 pt-6 border-t border-border">
                <Button className="w-full bg-primary hover:bg-primary/90">
                  Sign Lease Now
                </Button>
              </div>
            </div>

            <div className="absolute -bottom-4 -right-4 bg-secondary text-primary-foreground p-4 rounded-xl shadow-xl hidden md:block">
              <p className="text-2xl font-bold">95%</p>
              <p className="text-xs font-semibold uppercase tracking-wider">Approval Rate</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
