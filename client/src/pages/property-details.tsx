import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import propertiesData from "@/data/properties.json";
import type { Property } from "@/lib/types";
import { MapPin, Bed, Bath, Maximize, Share2, Heart, Calendar, Info, X, ChevronLeft, ChevronRight, CheckCircle2, Mail, Phone, Building2 } from "lucide-react";
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
  const property = (propertiesData as Property[]).find(p => p.id === id);
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    if (property) {
      updateMetaTags({
        title: `${property.title} - ${property.bedrooms}bd, ${property.bathrooms}ba in ${property.city}, MI`,
        description: `${property.title} - $${property.price}/month. ${property.bedrooms} bedrooms, ${property.bathrooms} bathrooms, ${property.sqft} sqft. Apply online at Choice Properties.`,
        type: "property"
      });
      addStructuredData(getPropertyStructuredData(property));
    }
  }, [property]);

  if (!match || !property) {
    return <NotFound />;
  }

  const allImages = property.images.map(img => imageMap[img] || placeholderExterior);
  const mainImage = allImages[currentImageIndex];
  
  const baseLat = 34.0522;
  const baseLng = -118.2437;
  const offset = parseInt(property.id) * 0.01;
  const position: [number, number] = [baseLat + offset, baseLng - offset];

  const similarProperties = (propertiesData as Property[])
    .filter(p => p.id !== property.id && (p.type === property.type || Math.abs(p.price - property.price) < 1000))
    .slice(0, 3);

  const minSwipeDistance = 50;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const openFullscreen = (index: number) => {
    setCurrentImageIndex(index);
    setIsFullscreen(true);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      nextImage();
    }
    if (isRightSwipe) {
      prevImage();
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-x-hidden">
      <Navbar />
      <Breadcrumb items={[
        { label: "Properties", href: "/properties" },
        { label: property.title }
      ]} />

      {isFullscreen && (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
          <div className="flex justify-between items-center p-4 text-white">
            <span className="text-lg font-semibold">
              {currentImageIndex + 1} / {allImages.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setIsFullscreen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          <div 
            className="flex-1 flex items-center justify-center relative"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 text-white hover:bg-white/20 h-12 w-12 z-10"
              onClick={prevImage}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>

            <img
              src={allImages[currentImageIndex]}
              alt={`Property ${currentImageIndex + 1}`}
              className="max-h-[calc(100vh-180px)] max-w-[90vw] object-contain select-none"
              draggable={false}
            />

            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 text-white hover:bg-white/20 h-12 w-12 z-10"
              onClick={nextImage}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          </div>

          <div className="flex gap-2 p-4 overflow-x-auto">
            {allImages.map((img, idx) => (
              <div
                key={idx}
                className={`flex-shrink-0 cursor-pointer border-2 ${
                  idx === currentImageIndex ? 'border-white' : 'border-transparent'
                }`}
                onClick={() => setCurrentImageIndex(idx)}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-20 h-16 object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto w-full p-2 md:p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[400px] md:h-[500px] rounded-xl overflow-hidden">
          <div className="md:col-span-2 h-full relative group cursor-pointer" onClick={() => openFullscreen(0)}>
            <img
              src={allImages[0]}
              alt="Main"
              className="w-full h-full object-cover hover:brightness-105 transition-all"
            />
            <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-md text-sm font-bold flex items-center gap-2 cursor-pointer hover:bg-black/90">
              <Maximize className="h-4 w-4" />
              {allImages.length} Photos
            </div>
          </div>

          <div className="hidden md:grid grid-cols-1 grid-rows-2 gap-2 md:col-span-2 h-full">
            <div className="relative h-full cursor-pointer" onClick={() => openFullscreen(1)}>
              <img
                src={allImages[1] || placeholderLiving}
                alt="Interior"
                className="w-full h-full object-cover hover:brightness-105 transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 h-full">
              <div className="cursor-pointer" onClick={() => openFullscreen(2)}>
                <img
                  src={allImages[2] || placeholderKitchen}
                  alt="Kitchen"
                  className="w-full h-full object-cover hover:brightness-105 transition-all"
                />
              </div>
              <div className="cursor-pointer" onClick={() => openFullscreen(3)}>
                <img
                  src={allImages[3] || placeholderBedroom}
                  alt="Bedroom"
                  className="w-full h-full object-cover hover:brightness-105 transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-[1200px] py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-baseline gap-3 mb-1">
                  <h1 className="text-4xl font-bold text-gray-900">${property.price.toLocaleString()}</h1>
                  <span className="text-xl text-gray-600">/mo</span>
                </div>
                <div className="flex items-center gap-6 text-lg text-gray-900 font-medium mb-2">
                  <span className="flex items-center gap-1">
                    <strong>{property.bedrooms}</strong> <span className="text-gray-600 font-normal">bd</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <strong>{property.bathrooms}</strong> <span className="text-gray-600 font-normal">ba</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <strong>{property.sqft.toLocaleString()}</strong> <span className="text-gray-600 font-normal">sqft</span>
                  </span>
                </div>
                <p className="text-gray-600 text-lg">{property.address}, {property.city}, {property.state} {property.zip}</p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <Link href={`/apply?propertyId=${property.id}`}>
                  <Button className="bg-primary hover:bg-primary/90 text-white gap-2 font-bold">
                    Apply Now
                  </Button>
                </Link>
                <Button 
                  onClick={() => {
                    const favs = JSON.parse(localStorage.getItem('choiceProperties_favorites') || '[]');
                    if (!favs.includes(property.id)) {
                      favs.push(property.id);
                      localStorage.setItem('choiceProperties_favorites', JSON.stringify(favs));
                    }
                  }}
                  variant="outline" 
                  className="text-primary border-primary hover:bg-primary/5 gap-2"
                >
                  <Heart className="h-4 w-4" /> Save
                </Button>
                <Button 
                  onClick={() => {
                    navigator.share?.({
                      title: property.title,
                      text: `Check out this property: ${property.title} - $${property.price}/mo`,
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
              <p className="text-gray-700 leading-relaxed text-lg">{property.description}</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Facts and features</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                <div className="flex gap-3 items-start">
                  <div className="mt-1"><Bed className="h-5 w-5 text-gray-500" /></div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Bedrooms</p>
                    <p className="text-gray-600 text-sm">{property.bedrooms}</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="mt-1"><Bath className="h-5 w-5 text-gray-500" /></div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Bathrooms</p>
                    <p className="text-gray-600 text-sm">{property.bathrooms}</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="mt-1"><Maximize className="h-5 w-5 text-gray-500" /></div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Square Footage</p>
                    <p className="text-gray-600 text-sm">{property.sqft.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="mt-1"><Calendar className="h-5 w-5 text-gray-500" /></div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Year Built</p>
                    <p className="text-gray-600 text-sm">{property.year_built}</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="mt-1"><Info className="h-5 w-5 text-gray-500" /></div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Property Type</p>
                    <p className="text-gray-600 text-sm">{property.type}</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="mt-1"><Building2 className="h-5 w-5 text-gray-500" /></div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Application Fee</p>
                    <p className="text-gray-600 text-sm">${property.application_fee}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="font-bold text-gray-900 mb-4 text-lg">Amenities</h3>
                <div className="flex flex-wrap gap-3">
                  {property.features.map((feature, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm py-1 px-3 font-normal"
                    >
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            {/* Similar Properties - More Prominent */}
            {similarProperties.length > 0 && (
              <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-8 border border-primary/10">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Similar Properties</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {similarProperties.map(prop => (
                    <PropertyCard 
                      key={prop.id} 
                      property={prop}
                      onQuickView={() => {}}
                    />
                  ))}
                </div>
              </div>
            )}

            <Separator />

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

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Property Manager</h2>
              <Link href={`/owner/${property.owner.slug}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={property.owner.profile_photo_url} alt={property.owner.name} />
                        <AvatarFallback>{property.owner.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold text-gray-900">{property.owner.name}</h3>
                          {property.owner.verified && (
                            <CheckCircle2 className="h-5 w-5 text-blue-500" />
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{property.owner.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <a
                            href={`mailto:${property.owner.email}`}
                            className="flex items-center gap-1 text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Mail className="h-4 w-4" /> {property.owner.email}
                          </a>
                          {property.owner.phone && (
                            <a
                              href={`tel:${property.owner.phone}`}
                              className="flex items-center gap-1 text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Phone className="h-4 w-4" /> {property.owner.phone}
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
              </Link>
            </div>

            {similarProperties.length > 0 && (
              <>
                <Separator />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Similar Properties</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {similarProperties.map((prop) => (
                      <PropertyCard key={prop.id} property={prop} />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24 shadow-lg border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-primary p-4 text-white text-center">
                <h3 className="font-bold text-lg">Request a Tour</h3>
                <p className="text-primary-foreground/80 text-sm">As early as today at 3:00 pm</p>
              </div>
              <CardContent className="p-6 space-y-4">
                <AgentContactDialog 
                  agent={{
                    id: property.owner.id,
                    name: property.owner.name,
                    email: property.owner.email,
                    phone: property.owner.phone || ''
                  }}
                  propertyId={property.id}
                  propertyTitle={property.title}
                  triggerText="Request a Tour"
                />

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
