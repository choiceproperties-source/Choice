import { Star, Quote, CheckCircle2 } from 'lucide-react';

const testimonials = [
  {
    name: "Sarah Martinez",
    location: "Los Angeles, CA",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
    rating: 5,
    text: "I was worried about finding a place with my credit history, but Choice Properties connected me with understanding landlords. The application process was transparent, and I moved into my dream apartment within two weeks!",
    property: "Downtown Loft",
    highlight: "Second-chance housing"
  },
  {
    name: "Michael Johnson",
    location: "Pasadena, CA",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
    rating: 5,
    text: "As a single dad relocating for work, I needed to find a home fast. Choice Properties made it happen. They understood my situation and helped me find a family-friendly neighborhood near great schools.",
    property: "Cozy Suburban Home",
    highlight: "Fast relocation"
  },
  {
    name: "Emily Chen",
    location: "Santa Monica, CA",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
    rating: 5,
    text: "The whole process was incredibly smooth. From the initial viewing to signing the lease digitally, everything was professional and efficient. The online application system saved me so much time!",
    property: "Seaside Condo",
    highlight: "Seamless process"
  }
];

export function TestimonialsSection() {
  return (
    <section className="py-24 bg-white dark:bg-slate-900">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16" data-aos="fade-up">
          <span className="inline-block px-4 py-2 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-sm font-semibold mb-4">
            Real Stories
          </span>
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-6">
            What Our Tenants Say
          </h2>
          <p className="text-muted-foreground text-lg">
            Real stories from real people who found their perfect home through Choice Properties.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, idx) => (
            <div 
              key={idx} 
              className="relative bg-card border border-border rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300"
              data-aos="fade-up"
              data-aos-delay={idx * 100}
            >
              <Quote className="absolute top-6 right-6 h-10 w-10 text-primary/10" />
              
              <div className="flex items-center gap-4 mb-6">
                <img 
                  src={testimonial.image} 
                  alt={testimonial.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                />
                <div>
                  <h4 className="font-bold text-lg text-foreground">{testimonial.name}</h4>
                  <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                </div>
              </div>
              
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              <p className="text-muted-foreground leading-relaxed mb-6">
                "{testimonial.text}"
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Rented</p>
                  <p className="text-sm font-semibold text-primary">{testimonial.property}</p>
                </div>
                <span className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-3 py-1 rounded-full font-medium">
                  {testimonial.highlight}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center" data-aos="fade-up" data-aos-delay="400">
          <div className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 px-6 py-3 rounded-full border border-green-200 dark:border-green-800">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-semibold">Join 500+ Happy Tenants Who Found Their Home</span>
          </div>
        </div>
      </div>
    </section>
  );
}
