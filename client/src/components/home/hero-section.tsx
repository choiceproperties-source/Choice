import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Search, Building2, Home, Building, Castle } from 'lucide-react';
import heroBg from "@assets/generated_images/modern_luxury_home_exterior_with_blue_sky.png";

export function HeroSection() {
  const [location, setLocation] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [propertyType, setPropertyType] = useState('');

  const buildSearchParams = () => {
    const params = new URLSearchParams();
    if (location) params.append('location', location);
    if (minPrice) params.append('minPrice', minPrice);
    if (maxPrice) params.append('maxPrice', maxPrice);
    if (bedrooms) params.append('bedrooms', bedrooms);
    if (propertyType) params.append('type', propertyType);
    return params.toString() ? `?${params.toString()}` : '';
  };

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
        role="img"
        aria-label="Modern luxury home exterior"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/60 to-blue-900/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      <div className="container relative z-10 px-4 py-16 max-w-6xl">
        <div className="text-center text-white mb-12" data-aos="fade-down">
          <span className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-6 border border-white/20">
            Trusted by 500+ Happy Tenants
          </span>
          <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight">
            Find the home that{' '}
            <span className="text-secondary relative">
              fits your life
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-secondary/50" viewBox="0 0 200 12" preserveAspectRatio="none">
                <path d="M0 10 Q50 0, 100 10 T200 10" stroke="currentColor" strokeWidth="3" fill="none"/>
              </svg>
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 font-light max-w-3xl mx-auto">
            Your Trusted Rental Housing Partner — From search to move-in, we're with you every step.
          </p>
        </div>

        <div 
          className="w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          <div className="flex border-b border-border overflow-x-auto">
            {[
              { value: '', label: 'All Types', icon: Search },
              { value: 'house', label: 'Houses', icon: Home },
              { value: 'apartment', label: 'Apartments', icon: Building2 },
              { value: 'condo', label: 'Condos', icon: Building },
              { value: 'townhouse', label: 'Townhouses', icon: Castle },
            ].map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  onClick={() => setPropertyType(type.value)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                    propertyType === type.value
                      ? 'bg-primary text-white'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                  data-testid={`button-property-type-${type.value || 'all'}`}
                >
                  <Icon className="h-4 w-4" />
                  {type.label}
                </button>
              );
            })}
          </div>

          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-foreground">Location</label>
                <input
                  type="text"
                  placeholder="City or neighborhood"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  data-testid="input-hero-location"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-foreground">Min Price</label>
                <input
                  type="number"
                  placeholder="$500"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  data-testid="input-hero-min-price"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-foreground">Max Price</label>
                <input
                  type="number"
                  placeholder="$5000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  data-testid="input-hero-max-price"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-foreground">Bedrooms</label>
                <select
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  className="px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                  data-testid="select-hero-bedrooms"
                >
                  <option value="">Any</option>
                  <option value="1">1 Bedroom</option>
                  <option value="2">2 Bedrooms</option>
                  <option value="3">3 Bedrooms</option>
                  <option value="4">4+ Bedrooms</option>
                </select>
              </div>

              <Link href={`/properties${buildSearchParams()}`}>
                <Button 
                  size="lg"
                  className="w-full bg-secondary hover:bg-secondary/90 text-primary-foreground font-bold h-12"
                  data-testid="button-hero-search"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Search
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-8 mt-10 text-white/80" data-aos="fade-up" data-aos-delay="400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-sm">Verified Listings Only</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-sm">Digital Lease Signing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-sm">48-Hour Approval</span>
          </div>
        </div>
      </div>
    </section>
  );
}
