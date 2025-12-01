import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface AdvancedFiltersProps {
  petFriendly: boolean;
  onPetFriendlyChange: (value: boolean) => void;
  furnished: boolean;
  onFurnishedChange: (value: boolean) => void;
  selectedAmenities: string[];
  onAmenitiesChange: (amenities: string[]) => void;
}

const AMENITIES = ['Pool', 'Gym', 'Parking', 'Laundry', 'Dishwasher', 'A/C', 'Fireplace', 'Garden'];

export function AdvancedFilters({
  petFriendly,
  onPetFriendlyChange,
  furnished,
  onFurnishedChange,
  selectedAmenities,
  onAmenitiesChange
}: AdvancedFiltersProps) {
  const handleAmenityChange = (amenity: string, checked: boolean) => {
    const updated = checked
      ? [...selectedAmenities, amenity]
      : selectedAmenities.filter(a => a !== amenity);
    onAmenitiesChange(updated);
  };

  return (
    <Card className="p-6 space-y-6">
      <h3 className="font-bold text-lg">More Options</h3>

      <div className="space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={petFriendly} onCheckedChange={() => onPetFriendlyChange(!petFriendly)} />
          <span className="text-sm font-medium">Pet Friendly</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={furnished} onCheckedChange={() => onFurnishedChange(!furnished)} />
          <span className="text-sm font-medium">Furnished</span>
        </label>
      </div>

      <div>
        <h4 className="font-semibold text-sm mb-3">Amenities</h4>
        <div className="grid grid-cols-2 gap-3">
          {AMENITIES.map(amenity => (
            <label key={amenity} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedAmenities.includes(amenity)}
                onCheckedChange={(checked) => handleAmenityChange(amenity, !!checked)}
              />
              <span className="text-sm">{amenity}</span>
            </label>
          ))}
        </div>
      </div>
    </Card>
  );
}
