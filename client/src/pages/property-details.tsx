import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { Property, PropertyWithOwner, Review, Owner } from "@/lib/types";
import { formatPrice, parseDecimal } from "@/lib/types";
import { MapPin, Bed, Bath, Maximize, Share2, Heart, Calendar, Info, Mail, Phone, Building2, Star } from "lucide-react";
import { useFavorites } from "@/hooks/use-favorites";
import { PhotoGallery } from "@/components/photo-gallery";
import NotFound from "@/pages/not-found";
import MapView from "@/components/map-view";
import { PropertyCard } from "@/components/property-card";
import { AgentContactDialog } from "@/components/agent-contact-dialog";
import { updateMetaTags, getPropertyStructuredData, addStructuredData } from "@/lib/seo";
import { Breadcrumb } from "@/components/breadcrumb";
import { trackEvent } from "@/lib/pwa";

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
  });

  // Fetch owner data if available
  const { data: owner } = useQuery<Owner>({
    queryKey: ['/api/users', property?.owner_id],
    enabled: !!property?.owner_id,
  });

  // Fetch reviews for this property
  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: ['/api/reviews/property', id],
    enabled: !!id,
  });

  if (!match) {
    return <NotFound />;
  }

  if (isLoading || !property) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading property details...</p>
          </div>
        </div>
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
  const lat = property.latitude ? parseFloat(property.latitude) : 34.0522;
  const lng = property.longitude ? parseFloat(property.longitude) : -118.2437;
  const position: [number, number] = [lat, lng];

  // Calculate average rating from reviews
  const averageRating = reviews && reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
    : 0;

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-x-hidden">
      <Navbar />
      <Breadcrumb items={[
        { label: "Properties", href: "/properties" },
        { label: property.title }
      ]} />

      <div className="max-w-[1400px] mx-auto w-full p-2 md:p-4">
        <PhotoGallery images={allImages} title={property.title} />
      </div>

      <div className="container mx-auto px-4 max-w-[1200px] py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-baseline gap-3 mb-1">
                  <h1 className="text-4xl font-bold text-gray-900">{formatPrice(property.price)}</h1>
                  <span className="text-xl text-gray-600">/mo</span>
                </div>
                <div className="flex items-center gap-6 text-lg text-gray-900 font-medium mb-2">
                  <span className="flex items-center gap-1">
                    <strong>{bedrooms}</strong> <span className="text-gray-600 font-normal">bd</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <strong>{bathrooms}</strong> <span className="text-gray-600 font-normal">ba</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <strong>{sqft ? sqft.toLocaleString() : 'N/A'}</strong> <span className="text-gray-600 font-normal">sqft</span>
                  </span>
                </div>
                <p className="text-gray-600 text-lg">{property.address}, {property.city}, {property.state} {property.zip_code}</p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <Link href={`/apply?propertyId=${property.id}`}>
                  <Button className="bg-primary hover:bg-primary/90 text-white gap-2 font-bold">
                    Apply Now
                  </Button>
                </Link>
                <Button 
                  onClick={() => toggleFavorite(property.id)}
                  variant={isFavorited(property.id) ? "default" : "outline"} 
                  className={isFavorited(property.id) ? "bg-red-500 hover:bg-red-600 text-white gap-2" : "text-primary border-primary hover:bg-primary/5 gap-2"}
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
                >
                  <Share2 className="h-4 w-4" /> Share
                </Button>
              </div>
            </div>

            <Separator />

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Overview</h2>
              <p className="text-gray-700 leading-relaxed text-lg">{property.description || 'No description available.'}</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Facts and features</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                <div className="flex gap-3 items-start">
                  <div className="mt-1"><Bed className="h-5 w-5 text-gray-500" /></div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Bedrooms</p>
                    <p className="text-gray-600 text-sm">{bedrooms}</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="mt-1"><Bath className="h-5 w-5 text-gray-500" /></div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Bathrooms</p>
                    <p className="text-gray-600 text-sm">{bathrooms}</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="mt-1"><Maximize className="h-5 w-5 text-gray-500" /></div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Square Footage</p>
                    <p className="text-gray-600 text-sm">{sqft ? sqft.toLocaleString() : 'N/A'}</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="mt-1"><Info className="h-5 w-5 text-gray-500" /></div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Property Type</p>
                    <p className="text-gray-600 text-sm">{property.property_type || 'Not specified'}</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="mt-1"><Building2 className="h-5 w-5 text-gray-500" /></div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Status</p>
                    <p className="text-gray-600 text-sm capitalize">{property.status || 'Active'}</p>
                  </div>
                </div>
              </div>

              {property.amenities && property.amenities.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-bold text-gray-900 mb-4 text-lg">Amenities</h3>
                  <div className="flex flex-wrap gap-3">
                    {property.amenities.map((amenity: string, i: number) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm py-1 px-3 font-normal"
                      >
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Reviews Section */}
            {reviews && reviews.length > 0 && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Reviews</h2>
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

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Map</h2>
              <MapView
                center={position}
                zoom={15}
                markers={[{ position, title: property.title, description: property.address }]}
                className="h-[300px] w-full rounded-lg border"
              />
            </div>

            <Separator />

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
