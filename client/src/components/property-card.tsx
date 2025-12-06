import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Bed, Bath, Maximize, Heart, CheckCircle2, Share2 } from "lucide-react";
import type { Property } from "@/lib/types";
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

interface PropertyCardProps {
  property: Property;
  onQuickView?: (property: Property) => void;
}

export function PropertyCard({ property, onQuickView }: PropertyCardProps) {
  const mainImage = property.images?.[0] ? (imageMap[property.images[0]] || placeholderExterior) : placeholderExterior;
  const [isFavorited, setIsFavorited] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem("choiceProperties_favorites") || "[]") as string[];
    setIsFavorited(favorites.includes(property.id));
  }, [property.id]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const favorites = JSON.parse(localStorage.getItem("choiceProperties_favorites") || "[]") as string[];
    
    if (isFavorited) {
      const updated = favorites.filter(id => id !== property.id);
      localStorage.setItem("choiceProperties_favorites", JSON.stringify(updated));
    } else {
      favorites.push(property.id);
      localStorage.setItem("choiceProperties_favorites", JSON.stringify(favorites));
    }
    
    setIsFavorited(!isFavorited);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/property/${property.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 group border border-gray-200 bg-white rounded-lg cursor-pointer" onClick={() => onQuickView?.(property)}>
      {/* Zillow-style image with top-left badge and top-right heart */}
      <div className="relative aspect-[1.6/1] overflow-hidden bg-gray-100">
        <Link href={`/property/${property.id}`}>
          <span className="block w-full h-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={mainImage}
              alt={property.title}
              loading="lazy"
              decoding="async"
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
            />
          </span>
        </Link>
        
        <div className="absolute top-2 left-2 flex gap-2">
          <Badge className="bg-secondary text-primary-foreground font-bold text-xs uppercase tracking-wider border border-secondary shadow-md">
            For Rent
          </Badge>
          <Badge className="bg-white/90 text-primary font-bold text-xs uppercase tracking-wider border border-gray-200 shadow-sm">
            {property.property_type || 'Property'}
          </Badge>
        </div>

        <div className="absolute top-2 right-2 flex gap-2 z-10" onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={handleShare}
            className="p-1.5 rounded-full bg-black/30 hover:bg-black/50 transition-colors text-white"
            title={copied ? "Copied!" : "Share property"}
          >
            <Share2 className="h-5 w-5" />
          </button>
          <button 
            onClick={toggleFavorite}
            className="p-1.5 rounded-full bg-black/30 hover:bg-black/50 transition-colors text-white"
            title={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            {isFavorited ? (
              <Heart className="h-5 w-5 fill-red-500 text-red-500" />
            ) : (
              <Heart className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      <CardContent className="p-4 pb-2">
        {/* Price Line */}
        <div className="flex items-baseline gap-1 mb-1">
            <span className="text-2xl font-bold text-gray-900">${property.price ? parseInt(property.price).toLocaleString() : 'N/A'}</span>
            <span className="text-gray-600 text-sm">/mo</span>
        </div>

        {/* Stats Line */}
        <div className="flex items-center gap-4 text-sm text-gray-700 mb-2 font-medium">
            <div className="flex items-center gap-1">
                <Bed className="h-4 w-4 text-primary" />
                <span className="font-bold">{property.bedrooms || 0}</span>
                <span className="font-normal">bds</span>
            </div>
            <div className="w-px h-3 bg-gray-300"></div>
            <div className="flex items-center gap-1">
                <Bath className="h-4 w-4 text-primary" />
                <span className="font-bold">{property.bathrooms || 0}</span>
                <span className="font-normal">ba</span>
            </div>
            <div className="w-px h-3 bg-gray-300"></div>
            <div className="flex items-center gap-1">
                <Maximize className="h-4 w-4 text-primary" />
                <span className="font-bold">{property.square_feet ? property.square_feet.toLocaleString() : 'N/A'}</span>
                <span className="font-normal">sqft</span>
            </div>
        </div>

        {/* Address */}
        <div className="text-sm text-gray-600 truncate">
            {property.address}, {property.city || 'N/A'}, {property.state || ''}
        </div>
      </CardContent>
    </Card>
  );
}
