import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { useAuth } from '@/lib/auth-context';
import { useApplications } from '@/hooks/use-applications';
import { useFavorites } from '@/hooks/use-favorites';
import { useSavedSearches } from '@/hooks/use-saved-searches';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Heart,
  FileText,
  Search,
  LogOut,
  MapPin,
  DollarSign,
  Bed,
  Bath,
  AlertCircle,
  Loader2,
  Trash2,
  ArrowRight,
} from 'lucide-react';

interface PropertyData {
  id: string;
  title: string;
  address: string;
  city: string;
  state: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  images?: string[];
  status?: string;
}

export default function RenterDashboard() {
  const { user, logout, isLoggedIn } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('applications');
  const [favoriteProperties, setFavoriteProperties] = useState<PropertyData[]>([]);
  const [loadingFavoritesDetails, setLoadingFavoritesDetails] = useState(false);

  // Fetch hooks
  const { applications, loading: appsLoading } = useApplications();
  const { favorites, toggleFavorite } = useFavorites();
  const { searches, loading: searchesLoading, deleteSearch } = useSavedSearches();

  // Fetch property details for favorites
  useEffect(() => {
    if (favorites.length === 0) {
      setFavoriteProperties([]);
      return;
    }

    const fetchFavoriteDetails = async () => {
      setLoadingFavoritesDetails(true);
      try {
        const properties: PropertyData[] = [];
        for (const favId of favorites) {
          const res = await fetch(`/api/properties/${favId}`);
          if (res.ok) {
            const data = await res.json();
            properties.push(data.data || data);
          }
        }
        setFavoriteProperties(properties);
      } catch (err) {
        console.error('Error fetching favorite properties:', err);
      } finally {
        setLoadingFavoritesDetails(false);
      }
    };

    fetchFavoriteDetails();
  }, [favorites]);

  // Redirect if not logged in
  if (!isLoggedIn || !user) {
    navigate('/login');
    return null;
  }

  // Handle delete search
  const handleDeleteSearch = async (searchId: string) => {
    const success = await deleteSearch(searchId);
    if (success) {
      toast({
        title: 'Success',
        description: 'Saved search deleted',
      });
    }
  };

  // Handle remove favorite
  const handleRemoveFavorite = async (propertyId: string) => {
    await toggleFavorite(propertyId);
    toast({
      title: 'Removed',
      description: 'Property removed from favorites',
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-50 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800',
      approved: 'bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800',
      rejected: 'bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800',
    };
    return colors[status] || colors.pending;
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
      approved: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      rejected: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
    };
    return styles[status] || styles.pending;
  };

  // Stats
  const stats = {
    applications: applications.length,
    favorites: favoriteProperties.length,
    savedSearches: searches.length,
    approved: applications.filter((a: any) => a.status === 'approved').length,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-blue-600 text-white py-12">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">Renter Dashboard</h1>
            <p className="text-white/80 mt-2">Welcome back, {user?.email?.split('@')[0]}!</p>
          </div>
          <Button
            onClick={() => {
              logout();
              navigate('/');
            }}
            variant="ghost"
            className="text-white hover:bg-white/20"
            data-testid="button-logout"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="container mx-auto px-4 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4" data-testid="stat-applications">
            <p className="text-sm font-semibold text-muted-foreground">Applications</p>
            <p className="text-3xl font-bold text-primary">{stats.applications}</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              {stats.approved} approved
            </p>
          </Card>
          <Card className="p-4" data-testid="stat-favorites">
            <p className="text-sm font-semibold text-muted-foreground">Saved Properties</p>
            <p className="text-3xl font-bold text-secondary">{stats.favorites}</p>
            <Heart className="h-4 w-4 text-red-500 mt-2" />
          </Card>
          <Card className="p-4" data-testid="stat-searches">
            <p className="text-sm font-semibold text-muted-foreground">Saved Searches</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {stats.savedSearches}
            </p>
            <Search className="h-4 w-4 text-blue-500 mt-2" />
          </Card>
          <Card className="p-4" data-testid="stat-member-since">
            <p className="text-sm font-semibold text-muted-foreground">Member Since</p>
            <p className="text-lg font-bold text-foreground">
              {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
              })}
            </p>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 mt-12 flex-1">
        <div className="flex gap-2 mb-8 flex-wrap border-b border-border">
          {[
            { id: 'applications', label: 'My Applications', icon: FileText },
            { id: 'favorites', label: 'Saved Properties', icon: Heart },
            { id: 'searches', label: 'Saved Searches', icon: Search },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-semibold transition-all border-b-2 flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-b-primary text-primary'
                  : 'border-b-transparent text-muted-foreground hover:text-foreground'
              }`}
              data-testid={`tab-${tab.id}`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* My Applications */}
        {activeTab === 'applications' && (
          <div className="space-y-4 pb-12" data-testid="section-applications">
            {appsLoading ? (
              <Card className="p-12 text-center">
                <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
                <p className="text-foreground font-semibold">Loading applications...</p>
              </Card>
            ) : applications.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-foreground font-semibold">No applications yet</p>
                <p className="text-muted-foreground text-sm mt-2">
                  Start your property search to apply for rentals
                </p>
                <Button
                  onClick={() => navigate('/properties')}
                  className="mt-4"
                  data-testid="button-browse-properties"
                >
                  Browse Properties
                </Button>
              </Card>
            ) : (
              applications.map((app: any, idx: number) => (
                <Card
                  key={app.id || idx}
                  className={`p-6 border-l-4 ${getStatusColor(app.status)}`}
                  data-testid={`card-application-${app.id || idx}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-foreground">
                        {app.property_title || 'Property Application'}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-4 w-4" />
                        {app.property_address || 'Address not available'}
                      </p>
                    </div>
                    <Badge
                      className={getStatusBadge(app.status)}
                      data-testid={`badge-status-${app.status}`}
                    >
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Monthly Rent</p>
                      <p className="font-bold text-primary">
                        ${(app.property_price || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Applied</p>
                      <p className="font-semibold text-foreground">
                        {app.submitted_at
                          ? new Date(app.submitted_at).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Application Fee</p>
                      <p className="font-semibold text-foreground">
                        ${(app.application_fee || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/property/${app.property_id}`)}
                        data-testid={`button-view-property-${app.id || idx}`}
                      >
                        View Property
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                  {app.notes && (
                    <div className="mt-4 p-3 bg-muted rounded text-sm text-muted-foreground">
                      <strong className="text-foreground">Notes:</strong> {app.notes}
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        )}

        {/* Saved Properties */}
        {activeTab === 'favorites' && (
          <div className="space-y-4 pb-12" data-testid="section-favorites">
            {loadingFavoritesDetails ? (
              <Card className="p-12 text-center">
                <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
                <p className="text-foreground font-semibold">Loading saved properties...</p>
              </Card>
            ) : favoriteProperties.length === 0 ? (
              <Card className="p-12 text-center">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-foreground font-semibold">No saved properties yet</p>
                <p className="text-muted-foreground text-sm mt-2">
                  Heart your favorite properties to save them here
                </p>
                <Button
                  onClick={() => navigate('/properties')}
                  className="mt-4"
                  data-testid="button-browse-properties-favorites"
                >
                  Browse Properties
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {favoriteProperties.map((property) => (
                  <Card
                    key={property.id}
                    className="overflow-hidden hover:shadow-lg transition-shadow"
                    data-testid={`card-favorite-${property.id}`}
                  >
                    <div className="aspect-video bg-muted relative">
                      {property.images?.[0] ? (
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                          <MapPin className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <Badge
                        className="absolute top-3 right-3 bg-primary"
                        data-testid={`badge-favorite-${property.id}`}
                      >
                        Saved
                      </Badge>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-1 text-foreground">
                        {property.title}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
                        <MapPin className="h-4 w-4" />
                        {property.city}, {property.state}
                      </p>
                      <div className="flex gap-4 mb-4 text-sm text-foreground">
                        <span className="flex items-center gap-1">
                          <Bed className="h-4 w-4" /> {property.bedrooms} bed
                        </span>
                        <span className="flex items-center gap-1">
                          <Bath className="h-4 w-4" /> {property.bathrooms} bath
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="font-bold text-primary text-lg flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {(property.price || 0).toLocaleString()}/mo
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/property/${property.id}`)}
                            data-testid={`button-view-${property.id}`}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveFavorite(property.id)}
                            data-testid={`button-remove-favorite-${property.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Saved Searches */}
        {activeTab === 'searches' && (
          <div className="space-y-4 pb-12" data-testid="section-searches">
            {searchesLoading ? (
              <Card className="p-12 text-center">
                <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
                <p className="text-foreground font-semibold">Loading saved searches...</p>
              </Card>
            ) : searches.length === 0 ? (
              <Card className="p-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-foreground font-semibold">No saved searches yet</p>
                <p className="text-muted-foreground text-sm mt-2">
                  Save your search filters to quickly revisit them
                </p>
                <Button
                  onClick={() => navigate('/properties')}
                  className="mt-4"
                  data-testid="button-create-search"
                >
                  Create Saved Search
                </Button>
              </Card>
            ) : (
              searches.map((search, idx) => (
                <Card
                  key={search.id}
                  className="p-6"
                  data-testid={`card-search-${search.id}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-2 text-foreground">
                        {search.name || `Search ${idx + 1}`}
                      </h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {search.filters?.city && (
                          <Badge variant="outline" data-testid={`badge-filter-city-${search.id}`}>
                            {search.filters.city}
                          </Badge>
                        )}
                        {search.filters?.minPrice && (
                          <Badge
                            variant="outline"
                            data-testid={`badge-filter-price-${search.id}`}
                          >
                            ${search.filters.minPrice?.toLocaleString()} -
                            ${search.filters.maxPrice?.toLocaleString()}
                          </Badge>
                        )}
                        {search.filters?.bedrooms && (
                          <Badge variant="outline" data-testid={`badge-filter-beds-${search.id}`}>
                            {search.filters.bedrooms}+ Beds
                          </Badge>
                        )}
                        {search.filters?.propertyType && (
                          <Badge
                            variant="outline"
                            data-testid={`badge-filter-type-${search.id}`}
                          >
                            {search.filters.propertyType}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Saved: {new Date(search.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const params = new URLSearchParams();
                          Object.entries(search.filters || {}).forEach(([key, value]) => {
                            if (value) params.append(key, String(value));
                          });
                          navigate(`/properties?${params.toString()}`);
                        }}
                        data-testid={`button-view-results-${search.id}`}
                      >
                        View Results
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSearch(search.id)}
                        data-testid={`button-delete-search-${search.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
