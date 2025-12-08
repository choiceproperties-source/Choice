import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { Property, PropertyWithOwner, Review, Owner } from "@/lib/types";
import { formatPrice, parseDecimal } from "@/lib/types";
import { Share2, Heart, Mail, Phone, Star } from "lucide-react";
import { useFavorites } from "@/hooks/use-favorites";
import { useNearbyPlaces } from "@/hooks/use-nearby-places";
import { usePropertyReviews } from "@/hooks/use-property-reviews";
import { PhotoGallery } from "@/components/photo-gallery";
import { PropertyOverview } from "@/components/property-overview";
import { AmenitiesGrid } from "@/components/amenities-grid";
import { MapSection } from "@/components/map-section";
import { NearbyPlaces } from "@/components/nearby-places";
import { ReviewsSection } from "@/components/reviews-section";
import NotFound from "@/pages/not-found";
import { PropertyCard } from "@/components/property-card";
import { AgentContactDialog } from "@/components/agent-contact-dialog";
import { updateMetaTags, getPropertyStructuredData, addStructuredData } from "@/lib/seo";
import { Breadcrumb } from "@/components/breadcrumb";
import { trackEvent } from "@/lib/pwa";
import { PropertyDetailsSkeleton } from "@/components/property-details-skeleton";
import { MobileActionBar } from "@/components/mobile-action-bar";

import placeholderExterior from "@assets/generated_images/modern_luxury_home_exterior_with_blue_sky.png";
import placeholderLiving from "@assets/generated_images/bright_modern_living_room_interior.png";
import placeholderKitchen from "@assets/generated_images/modern_kitchen_with_marble_island.png";
import placeholderBedroom from "@assets/generated_images/cozy_modern_bedroom_interior.png";

const imageMap: Record<string, string> = {
  "placeholder-exterior": placeholderExterior,
  "placeholder-living": placeholderLiving,
  "placeholder-kitchen": placeholderKitchen,
  "placeholder-bedroom": placeholderBedroom,
};

export default function PropertyDetails() {
  const [match, params] = useRoute("/property/:id");
  const id = params?.id;
  const { isFavorited, toggleFavorite } = useFavorites();

  // Fetch property data from backend
  const { data: property, isLoading } = useQuery<Property>({
    queryKey: ['/api/properties', id],
    enabled: !!id && !!match,
    select: (res: any) => res?.data,
  });

  // Fetch owner data if available
  const { data: owner } = useQuery<Owner>({
    queryKey: ['/api/users', property?.owner_id],
    enabled: !!property?.owner_id,
    select: (res: any) => res?.data,
  });

  // Fetch reviews for this property
  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: ['/api/reviews/property', id],
    enabled: !!id,
    select: (res: any) => res?.data ?? [],
  });

  // Move hooks to top level (CRITICAL FIX #2)
  const lat = property?.latitude ? parseFloat(String(property.latitude)) : 34.0522;
  const lng = property?.longitude ? parseFloat(String(property.longitude)) : -118.2437;
  const nearbyPlaces = useNearbyPlaces(lat, lng);

  if (!match) {
    return <NotFound />;
  }

  if (isLoading || !property) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <PropertyDetailsSkeleton />
        <Footer />
      </div>
    );
  }

  // Update SEO tags
  const bedrooms = property.bedrooms || 0;
  const bathrooms = Math.round(parseDecimal(property.bathrooms));
  const sqft = property.square_feet || 0;
  
  updateMetaTags({
    title: `${property.title} - ${bedrooms}bd, ${bathrooms}ba in ${property.city}`,
    description: `${property.title} - ${formatPrice(property.price)}/month. ${bedrooms} bedrooms, ${bathrooms} bathrooms, ${sqft} sqft. Apply online at Choice Properties.`,
    type: "property"
  });
  addStructuredData(getPropertyStructuredData(property));

  // Build image array
  const allImages = (property.images || []).length > 0 
    ? property.images!.map(img => imageMap[img] || placeholderExterior)
    : [placeholderExterior, placeholderLiving, placeholderKitchen, placeholderBedroom];
  
  // Use real coordinates from database
  const position: [number, number] = [lat, lng];

  // Calculate average rating from reviews
  const averageRating = reviews && reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
    : 0;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col overflow-x-hidden">
      <Navbar />
      <Breadcrumb items={[
        { label: "Properties", href: "/properties" },
        { label: property.title }
      ]} />
      <MobileActionBar
        property={property}
        isFavorited={isFavorited(property.id)}
        onToggleFavorite={() => toggleFavorite(property.id)}
      />

      <div className="max-w-[1400px] mx-auto w-full p-2 md:p-4">
        <PhotoGallery images={allImages} title={property.title} />
      </div>

      <div className="container mx-auto px-4 max-w-[1200px] py-6 pb-32 md:pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            {/* Property Overview Section */}
            <PropertyOverview property={property} />

            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap" data-testid="section-actions">
              <Link href={`/apply?propertyId=${property.id}`}>
                <Button 
                  className="bg-primary hover:bg-primary/90 text-white gap-2 font-bold"
                  data-testid="button-apply-now"
                >
                  Apply Now
                </Button>
              </Link>
              <Button 
                onClick={() => toggleFavorite(property.id)}
                variant={isFavorited(property.id) ? "default" : "outline"} 
                className={isFavorited(property.id) ? "bg-red-500 hover:bg-red-600 text-white gap-2" : "text-primary border-primary hover:bg-primary/5 gap-2"}
                data-testid={isFavorited(property.id) ? "button-unsave" : "button-save"}
              >
                <Heart className={isFavorited(property.id) ? "h-4 w-4 fill-white" : "h-4 w-4"} /> 
                {isFavorited(property.id) ? "Saved" : "Save"}
              </Button>
              <Button 
                onClick={() => {
                  navigator.share?.({
                    title: property.title,
                    text: `Check out this property: ${property.title} - ${formatPrice(property.price)}/mo`,
                    url: window.location.href
                  });
                }}
                variant="outline" 
                className="text-primary border-primary hover:bg-primary/5 gap-2"
                data-testid="button-share"
              >
                <Share2 className="h-4 w-4" /> Share
              </Button>
            </div>

            <Separator />

            {/* Description Section */}
            <div data-testid="section-overview">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Overview</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">{property.description || 'No description available.'}</p>
            </div>

            {/* Amenities Section */}
            <div data-testid="section-amenities">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Amenities</h2>
              <AmenitiesGrid amenities={property.amenities as string[] | undefined} />
            </div>

            <Separator />

            {/* Reviews Section */}
            {reviews && reviews.length > 0 && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reviews</h2>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${i <= Math.round(averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">({reviews.length} reviews)</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {reviews.slice(0, 3).map((review) => (
                      <Card key={review.id} className="border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3 mb-2">
                            <div className="flex-1">
                              <div className="flex gap-1 mb-1">
                                {[1, 2, 3, 4, 5].map(i => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${i <= (review.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                  />
                                ))}
                              </div>
                              <p className="font-bold text-gray-900">{review.title || 'Review'}</p>
                              {review.users && (
                                <p className="text-sm text-gray-600">{review.users.full_name || 'Anonymous'}</p>
                              )}
                            </div>
                          </div>
                          {review.comment && (
                            <p className="text-gray-700 text-sm">{review.comment}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Location & Nearby Places Section */}
            <div data-testid="section-location-nearby">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Location & Nearby Places</h2>
              
              {/* Map */}
              <div className="mb-8">
                <MapSection 
                  center={position} 
                  title={property.title} 
                  address={property.address}
                />
              </div>

              {/* Nearby Places */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Nearby Places</h3>
                <NearbyPlaces places={nearbyPlaces} />
              </div>
            </div>

            {/* Property Owner/Manager */}
            {owner && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Property Manager</h2>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={owner.profile_image || undefined} alt={owner.full_name || 'Manager'} />
                        <AvatarFallback>{owner.full_name?.charAt(0) || 'M'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold text-gray-900">{owner.full_name || 'Property Manager'}</h3>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{owner.bio || 'Professional property manager'}</p>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <a
                            href={`mailto:${owner.email}`}
                            className="flex items-center gap-1 text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Mail className="h-4 w-4" /> {owner.email}
                          </a>
                          {owner.phone && (
                            <a
                              href={`tel:${owner.phone}`}
                              className="flex items-center gap-1 text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Phone className="h-4 w-4" /> {owner.phone}
                            </a>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" className="border-primary text-primary hover:bg-primary/5">
                        View Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24 shadow-lg border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-primary p-4 text-white text-center">
                <h3 className="font-bold text-lg">Request a Tour</h3>
                <p className="text-primary-foreground/80 text-sm">As early as today at 3:00 pm</p>
              </div>
              <CardContent className="p-6 space-y-4">
                {owner && (
                  <AgentContactDialog 
                    agent={{
                      id: owner.id,
                      name: owner.full_name || 'Property Manager',
                      email: owner.email,
                      phone: owner.phone || ''
                    }}
                    propertyId={property.id}
                    propertyTitle={property.title}
                    triggerText="Request a Tour"
                  />
                )}

                <div className="flex items-center gap-2 my-4">
                  <div className="h-px bg-gray-200 flex-1"></div>
                  <span className="text-xs text-gray-400 uppercase font-bold">or</span>
                  <div className="h-px bg-gray-200 flex-1"></div>
                </div>

                <Link href={`/apply?propertyId=${property.id}`}>
                  <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/5 font-bold h-12">
                    Start Application
                  </Button>
                </Link>

                <p className="text-xs text-gray-400 text-center mt-4">
                  By pressing Request a Tour, you agree that Choice Properties may call/text you about your inquiry.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <Footer />
      </div>
    </div>
  );
}
