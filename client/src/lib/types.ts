export interface Owner {
  id: string;
  name: string;
  slug: string;
  profile_photo_url: string;
  email: string;
  phone?: string;
  verified: boolean;
  description: string;
  created_at: string;
}

export interface Review {
  id: string;
  property_id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Property {
  id: string;
  owner_id: string;
  owner: Owner;
  title: string;
  price: number;
  address: string;
  city: string;
  state: string;
  zip: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  year_built: number;
  description: string;
  features: string[];
  type: string;
  location: string;
  images: string[];
  featured: boolean;
  listing_type: 'rent' | 'buy' | 'sell';
  application_fee?: number;
  property_tax_annual?: number;
  hoa_fee_monthly?: number;
  status: 'available' | 'pending' | 'sold' | 'leased';
  pet_friendly?: boolean;
  furnished?: boolean;
  amenities?: string[];
  reviews?: Review[];
  average_rating?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'agent' | 'admin';
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => void;
  signup: (email: string, name: string, password: string) => void;
  logout: () => void;
  isLoggedIn: boolean;
}
