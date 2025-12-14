import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { PropertyCard } from '@/components/property-card';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useProperties } from '@/hooks/use-properties';

export function FeaturedProperties() {
  const { properties = [], loading } = useProperties();
  const featuredProperties = Array.isArray(properties) ? properties.slice(0, 3) : [];

  return (
    <section className="py-24 bg-muted/30 dark:bg-slate-800/50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-12" data-aos="fade-up">
          <div>
            <span className="inline-block px-4 py-2 bg-secondary/10 text-secondary rounded-full text-sm font-semibold mb-4">
              Featured Listings
            </span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-2">
              Featured Properties
            </h2>
            <p className="text-muted-foreground text-lg">
              Browse verified rental listings from across the country.
            </p>
          </div>
          <Link href="/properties">
            <Button variant="link" className="text-primary font-bold text-lg hidden md:flex group">
              View All Listings 
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProperties.map((property, idx) => (
              <div key={property.id} data-aos="fade-up" data-aos-delay={idx * 100}>
                <PropertyCard property={property} />
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 text-center md:hidden">
          <Link href="/properties">
            <Button variant="outline" className="w-full h-12 font-bold">
              View All Properties
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
