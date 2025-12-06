import { useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { PropertyCard } from "@/components/property-card";
import { Testimonials } from "@/components/testimonials";
import { useProperties } from "@/hooks/use-properties";
import type { Property } from "@/lib/types";
import { ArrowRight, CheckCircle2, Users, Home as HomeIcon, MapPin, ShieldCheck } from "lucide-react";
import heroBg from "@assets/generated_images/modern_luxury_home_exterior_with_blue_sky.png";
import { updateMetaTags, getOrganizationStructuredData, addStructuredData } from "@/lib/seo";

export default function Home() {
  const { properties, loading } = useProperties();

  // Initialize reviews on mount
  useEffect(() => {
    const existing = localStorage.getItem('choiceProperties_reviews');
    if (!existing) {
      const sampleReviews = [
        { id: "rev1", property_id: "1", user_name: "Sarah Johnson", rating: 5, comment: "Amazing place! Exactly as described. The owner was very responsive and helpful.", created_at: "2024-11-28T10:30:00Z" },
        { id: "rev2", property_id: "1", user_name: "Michael Lee", rating: 4, comment: "Great location and amenities. Slight issue with water pressure but was fixed quickly.", created_at: "2024-11-25T14:15:00Z" },
        { id: "rev3", property_id: "2", user_name: "Emma Wilson", rating: 5, comment: "The luxury touches everywhere. Felt like staying in a 5-star resort!", created_at: "2024-11-20T09:00:00Z" },
        { id: "rev4", property_id: "3", user_name: "James Chen", rating: 5, comment: "Perfect downtown location. Love being able to walk everywhere.", created_at: "2024-11-18T16:45:00Z" },
        { id: "rev5", property_id: "3", user_name: "Lisa Anderson", rating: 4, comment: "Great apartment, very modern. A bit pricey but worth it.", created_at: "2024-11-15T11:20:00Z" },
        { id: "rev6", property_id: "4", user_name: "David Martinez", rating: 5, comment: "Family loved the backyard and quiet neighborhood. Highly recommend!", created_at: "2024-11-12T13:30:00Z" },
        { id: "rev7", property_id: "5", user_name: "Rachel Green", rating: 5, comment: "Waterfront condo is breathtaking! Beach access is perfect for weekends.", created_at: "2024-11-10T15:00:00Z" },
        { id: "rev8", property_id: "5", user_name: "Kevin Park", rating: 4, comment: "Beautiful view, only minor issue with elevator maintenance.", created_at: "2024-11-08T10:15:00Z" },
        { id: "rev9", property_id: "6", user_name: "Nina Patel", rating: 5, comment: "Perfect for tech professionals. Love the co-working space!", created_at: "2024-11-05T12:00:00Z" },
        { id: "rev10", property_id: "6", user_name: "Tyler Brooks", rating: 5, comment: "Amazing value for money. Great management team too.", created_at: "2024-11-01T14:30:00Z" }
      ];
      localStorage.setItem('choiceProperties_reviews', JSON.stringify(sampleReviews));
    }
  }, []);

  useEffect(() => {
    updateMetaTags({
      title: "Choice Properties - Find Your Perfect Rental Home",
      description: "Your trusted rental housing partner. Browse properties, apply online, and find your perfect home in Troy, MI.",
      image: "https://choiceproperties.com/og-image.png",
      url: "https://choiceproperties.com"
    });
    addStructuredData(getOrganizationStructuredData());
  }, []);

  // Show first 3 properties as featured (from backend data)
  const featuredProperties = properties.slice(0, 3);

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[700px] flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transform scale-105"
          style={{ backgroundImage: `url(${heroBg})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-primary/70 via-primary/50 to-background/90 backdrop-blur-[1px]" />
        </div>

        <div className="container relative z-10 px-4 text-center text-white space-y-8 max-w-4xl">
          <div data-aos="fade-down">
            <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4 leading-tight">
              Find the home that <span className="text-secondary">fits your life</span>
            </h1>
            <p className="text-lg md:text-2xl text-white/90 font-light">
              Your Trusted Rental Housing Partner
            </p>
          </div>
          
          <p className="text-lg md:text-xl max-w-2xl mx-auto text-white/80 leading-relaxed" data-aos="fade-up" data-aos-delay="200">
            At Choice Properties, we are dedicated to solving one of life’s most important needs—finding a place you can truly call home.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6" data-aos="fade-up" data-aos-delay="400">
            <Link href="/properties">
              <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-primary-foreground font-bold text-lg px-10 h-14 shadow-xl hover:scale-105 transition-transform">
                Explore Rentals
              </Button>
            </Link>
            <Link href="/buy">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white font-bold text-lg px-10 h-14 shadow-xl hover:scale-105 transition-transform">
                Buy a Home
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-primary font-bold text-lg px-10 h-14 bg-transparent hover:scale-105 transition-transform">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Our Services Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16" data-aos="fade-up">
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-primary mb-6">Your Complete Real Estate Solution</h2>
            <p className="text-muted-foreground text-lg">
              Whether you're renting, buying, or selling, Choice Properties connects you with the right home at the right price.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <Link href="/properties">
              <div className="group p-8 rounded-2xl bg-blue-50 border-2 border-primary hover:border-primary hover:shadow-xl transition-all duration-300 cursor-pointer">
                <div className="text-4xl font-bold text-primary mb-4">🏠</div>
                <h3 className="font-heading text-2xl font-bold mb-3 text-primary group-hover:text-primary">For Rent</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Browse thousands of rental properties across the country. Find your perfect home with our easy application process.
                </p>
              </div>
            </Link>
            <Link href="/buy">
              <div className="group p-8 rounded-2xl bg-green-50 border-2 border-green-600 hover:border-green-600 hover:shadow-xl transition-all duration-300 cursor-pointer">
                <div className="text-4xl font-bold text-green-600 mb-4">🔑</div>
                <h3 className="font-heading text-2xl font-bold mb-3 text-green-600 group-hover:text-green-700">For Sale</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Discover properties for purchase. Use our mortgage calculator to estimate your monthly payments and find your dream home.
                </p>
              </div>
            </Link>
            <Link href="/sell">
              <div className="group p-8 rounded-2xl bg-amber-50 border-2 border-amber-600 hover:border-amber-600 hover:shadow-xl transition-all duration-300 cursor-pointer">
                <div className="text-4xl font-bold text-amber-600 mb-4">📈</div>
                <h3 className="font-heading text-2xl font-bold mb-3 text-amber-600 group-hover:text-amber-700">Sell or List</h3>
                <p className="text-muted-foreground leading-relaxed">
                  List your property in minutes. Reach thousands of qualified buyers and renters through our trusted network.
                </p>
              </div>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <CheckCircle2 className="h-10 w-10 text-secondary" />,
                title: "Verified Listings",
                description: "Every property is verified and legitimate. No scams, no surprises - just quality homes."
              },
              {
                icon: <ShieldCheck className="h-10 w-10 text-secondary" />,
                title: "Secure Transactions",
                description: "Protected buyer and seller interactions. Your information stays safe with our secure platform."
              },
              {
                icon: <HomeIcon className="h-10 w-10 text-secondary" />,
                title: "All Property Types",
                description: "Houses, apartments, condos, townhomes. Find exactly what you're looking for."
              },
              {
                icon: <MapPin className="h-10 w-10 text-secondary" />,
                title: "Nationwide Access",
                description: "Properties available nationwide. Find your perfect match wherever life takes you."
              }
            ].map((feature, idx) => (
              <div 
                key={idx} 
                className="group p-8 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
                data-aos="fade-up"
                data-aos-delay={idx * 100}
              >
                <div className="mb-6 p-4 rounded-full bg-primary/5 w-fit group-hover:bg-primary/10 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="font-heading text-xl font-bold mb-3 text-primary">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who We Help Banner */}
      <section className="py-20 bg-primary text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div data-aos="fade-right">
              <h2 className="font-heading text-3xl md:text-5xl font-bold mb-6">Who We Help</h2>
              <p className="text-lg text-white/80 mb-8 leading-relaxed">
                We specialize in matching renters with properties that fit their lifestyle, budget, and needs. 
                Wherever you are in the USA, Choice Properties is ready to pair you with a home that’s right for you.
              </p>
              <ul className="space-y-4">
                {[
                  "Working professionals",
                  "Families and single parents",
                  "Students & First-time renters",
                  "Relocating individuals",
                  "Renters rebuilding credit",
                  "Those seeking second-chance housing"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center text-lg font-medium">
                    <CheckCircle2 className="h-6 w-6 text-secondary mr-3 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative" data-aos="fade-left">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10">
                <img 
                  src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Happy family moving in" 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
              {/* Floating Badge */}
              <div className="absolute -bottom-6 -left-6 bg-secondary text-primary-foreground p-6 rounded-xl shadow-xl hidden md:block">
                <p className="text-3xl font-bold">100%</p>
                <p className="text-sm font-semibold uppercase tracking-wider">Verified Listings</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials />

      {/* Featured Properties */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12" data-aos="fade-up">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary mb-2">Featured Properties</h2>
              <p className="text-muted-foreground text-lg">Hand-picked selections just for you.</p>
            </div>
            <Link href="/properties">
              <Button variant="link" className="text-secondary font-bold text-lg hidden md:flex group">
                View All Listings <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProperties.map((property, idx) => (
              <div key={property.id} data-aos="fade-up" data-aos-delay={idx * 100}>
                <PropertyCard property={property} />
              </div>
            ))}
          </div>

          <div className="mt-12 text-center md:hidden">
            <Link href="/properties">
              <Button className="w-full bg-outline border-primary text-primary h-12 font-bold">View All Properties</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16" data-aos="fade-up">
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-primary mb-6">What Our Tenants Say</h2>
            <p className="text-muted-foreground text-lg">
              Real stories from real people who found their perfect home through Choice Properties.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Sarah Martinez",
                location: "Los Angeles, CA",
                image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
                rating: 5,
                text: "I was worried about finding a place with my credit history, but Choice Properties connected me with understanding landlords. The application process was transparent, and I moved into my dream apartment within two weeks. The team was supportive every step of the way!",
                property: "Downtown Loft"
              },
              {
                name: "Michael Johnson",
                location: "Pasadena, CA",
                image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
                rating: 5,
                text: "As a single dad relocating for work, I needed to find a home fast. Choice Properties made it happen. They understood my situation and helped me find a family-friendly neighborhood near great schools. Couldn't be happier with my new place!",
                property: "Cozy Suburban Home"
              },
              {
                name: "Emily Chen",
                location: "Santa Monica, CA",
                image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
                rating: 5,
                text: "The whole process was incredibly smooth. From the initial viewing to signing the lease, everything was professional and efficient. The property manager is responsive, and the online application system saved me so much time. Highly recommend Choice Properties!",
                property: "Seaside Condo"
              }
            ].map((testimonial, idx) => (
              <div 
                key={idx} 
                className="bg-card border rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300"
                data-aos="fade-up"
                data-aos-delay={idx * 100}
              >
                <div className="flex items-center gap-4 mb-6">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                  />
                  <div>
                    <h4 className="font-bold text-lg text-primary">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                  </div>
                </div>
                
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 fill-yellow-400" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>

                <p className="text-muted-foreground leading-relaxed mb-4 italic">
                  "{testimonial.text}"
                </p>

                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Rented: <span className="font-semibold text-primary">{testimonial.property}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center" data-aos="fade-up" data-aos-delay="400">
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-6 py-3 rounded-full border border-green-200">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-semibold">Over 500+ Happy Tenants in 2024</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-muted/20 relative overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <div data-aos="zoom-in">
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-primary mb-6">Your next rental starts here.</h2>
            <p className="text-muted-foreground text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              We don’t just list properties—we guide you through the entire process. 
              From viewing a home to getting your application approved, we’re with you every step of the way.
            </p>
            <Link href="/properties">
              <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-primary-foreground font-bold h-16 px-12 text-xl shadow-lg hover:shadow-xl transition-all">
                Start Searching Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
