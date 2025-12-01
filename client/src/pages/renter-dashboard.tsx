import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { useAuth } from '@/lib/auth-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, FileText, Search, User, LogOut, MapPin, DollarSign, Bed, Bath } from 'lucide-react';
import propertiesData from '@/data/properties.json';
import type { Property } from '@/lib/types';

export default function RenterDashboard() {
  const { user, logout, isLoggedIn } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('applications');

  // Redirect if not logged in
  if (!isLoggedIn || !user) {
    navigate('/login');
    return null;
  }

  // Get applications
  const applications = useMemo(() => {
    return JSON.parse(localStorage.getItem('choiceProperties_applications') || '[]');
  }, []);

  // Get favorites
  const favorites = useMemo(() => {
    const favIds = JSON.parse(localStorage.getItem('choiceProperties_favorites') || '[]');
    const allProps = propertiesData as Property[];
    return allProps.filter(p => favIds.includes(p.id));
  }, []);

  // Get saved searches
  const savedSearches = useMemo(() => {
    return JSON.parse(localStorage.getItem('choiceProperties_savedSearches') || '[]');
  }, []);

  // Count stats
  const stats = {
    applications: applications.length,
    favorites: favorites.length,
    savedSearches: savedSearches.length,
    approved: applications.filter((a: any) => a.status === 'approved').length
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-50 text-yellow-800 border-yellow-200',
      approved: 'bg-green-50 text-green-800 border-green-200',
      rejected: 'bg-red-50 text-red-800 border-red-200'
    };
    return colors[status] || colors.pending;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return styles[status] || styles.pending;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white py-12">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">Your Dashboard</h1>
            <p className="text-white/80 mt-2">Welcome back, {user?.name}!</p>
          </div>
          <Button
            onClick={logout}
            variant="ghost"
            className="text-white hover:bg-white/20"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="container mx-auto px-4 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-white">
            <p className="text-gray-600 text-sm font-semibold">Applications</p>
            <p className="text-3xl font-bold text-primary">{stats.applications}</p>
            <p className="text-xs text-green-600 mt-1">{stats.approved} approved</p>
          </Card>
          <Card className="p-4 bg-white">
            <p className="text-gray-600 text-sm font-semibold">Saved Properties</p>
            <p className="text-3xl font-bold text-secondary">{stats.favorites}</p>
            <Heart className="h-4 w-4 text-red-500 mt-2" />
          </Card>
          <Card className="p-4 bg-white">
            <p className="text-gray-600 text-sm font-semibold">Saved Searches</p>
            <p className="text-3xl font-bold text-blue-600">{stats.savedSearches}</p>
            <Search className="h-4 w-4 text-blue-500 mt-2" />
          </Card>
          <Card className="p-4 bg-white">
            <p className="text-gray-600 text-sm font-semibold">Member Since</p>
            <p className="text-lg font-bold text-gray-800">
              {new Date(user.created_at || Date.now()).toLocaleDateString()}
            </p>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 mt-12 flex-1">
        <div className="flex gap-2 mb-8 flex-wrap border-b">
          {[
            { id: 'applications', label: 'My Applications', icon: '📋' },
            { id: 'favorites', label: 'Saved Properties', icon: '❤️' },
            { id: 'searches', label: 'Saved Searches', icon: '🔍' },
            { id: 'profile', label: 'Profile', icon: '👤' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-semibold transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-b-primary text-primary'
                  : 'border-b-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* My Applications */}
        {activeTab === 'applications' && (
          <div className="space-y-4 pb-12">
            {applications.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-semibold">No applications yet</p>
                <p className="text-gray-500 text-sm mt-2">Start your property search to apply for rentals</p>
              </Card>
            ) : (
              applications.map((app: any, idx: number) => (
                <Card key={idx} className={`p-6 border-l-4 ${getStatusColor(app.status)}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{app.property_title}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <MapPin className="h-4 w-4" />
                        {app.property_address}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(app.status)}`}>
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-gray-600">Monthly Rent</p>
                      <p className="font-bold text-primary">${app.property_price?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Applied</p>
                      <p className="font-semibold text-gray-800">{new Date(app.submitted_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Application Fee</p>
                      <p className="font-semibold text-gray-800">${app.application_fee || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Status Since</p>
                      <p className="font-semibold text-gray-800">{new Date(app.status_updated_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {app.notes && (
                    <div className="mt-4 p-3 bg-gray-100 rounded text-sm text-gray-700">
                      <strong>Notes:</strong> {app.notes}
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        )}

        {/* Saved Properties */}
        {activeTab === 'favorites' && (
          <div className="space-y-4 pb-12">
            {favorites.length === 0 ? (
              <Card className="p-12 text-center">
                <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-semibold">No saved properties yet</p>
                <p className="text-gray-500 text-sm mt-2">Heart your favorite properties to save them here</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {favorites.map(property => (
                  <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video bg-gray-200 relative">
                      {property.images && property.images[0] && (
                        <img
                          src={`https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop`}
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <Badge className="absolute top-3 right-3 bg-primary">
                        {property.listing_type === 'rent' ? '🔑 For Rent' : '🏠 For Sale'}
                      </Badge>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-1">{property.title}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mb-3">
                        <MapPin className="h-4 w-4" />
                        {property.city}, {property.state}
                      </p>
                      <div className="flex gap-4 mb-4 text-sm text-gray-700">
                        <span className="flex items-center gap-1">
                          <Bed className="h-4 w-4" /> {property.bedrooms} bed
                        </span>
                        <span className="flex items-center gap-1">
                          <Bath className="h-4 w-4" /> {property.bathrooms} bath
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="font-bold text-primary text-lg">
                          ${property.price?.toLocaleString()}
                          {property.listing_type === 'rent' && <span className="text-sm text-gray-600">/mo</span>}
                        </p>
                        <Heart className="h-5 w-5 fill-red-500 text-red-500" />
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
          <div className="space-y-4 pb-12">
            {savedSearches.length === 0 ? (
              <Card className="p-12 text-center">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-semibold">No saved searches yet</p>
                <p className="text-gray-500 text-sm mt-2">Save your search filters to quickly revisit them</p>
              </Card>
            ) : (
              savedSearches.map((search: any, idx: number) => (
                <Card key={idx} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-2">{search.name || `Search ${idx + 1}`}</h3>
                      <div className="flex flex-wrap gap-2">
                        {search.filters?.city && (
                          <Badge variant="outline">{search.filters.city}</Badge>
                        )}
                        {search.filters?.minPrice && (
                          <Badge variant="outline">
                            ${search.filters.minPrice?.toLocaleString()} - ${search.filters.maxPrice?.toLocaleString()}
                          </Badge>
                        )}
                        {search.filters?.bedrooms && (
                          <Badge variant="outline">{search.filters.bedrooms}+ Beds</Badge>
                        )}
                        {search.filters?.type && (
                          <Badge variant="outline">{search.filters.type}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-3">
                        Saved: {new Date(search.savedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      onClick={() => navigate(`/properties?search=${idx}`)}
                      className="bg-primary"
                    >
                      View Results
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Profile */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl pb-12">
            <Card className="p-8">
              <div className="flex items-center gap-4 mb-8 pb-8 border-b">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{user?.name}</h2>
                  <p className="text-gray-600">{user?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Member Since</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {new Date(user.created_at || Date.now()).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Total Applications</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">{stats.applications}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Approved Applications</p>
                  <p className="text-lg font-semibold text-green-600 mt-1">{stats.approved}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Saved Properties</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">{stats.favorites}</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Account Status</h3>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
                <p className="text-sm text-gray-700 mt-3">
                  Your account is in good standing. Continue exploring properties and applying to rentals.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Account Actions</h3>
                <Button variant="outline" className="w-full justify-start text-gray-700">
                  📧 Change Email (Coming Soon)
                </Button>
                <Button variant="outline" className="w-full justify-start text-gray-700">
                  🔒 Change Password (Coming Soon)
                </Button>
                <Button
                  onClick={logout}
                  variant="outline"
                  className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                >
                  🚪 Sign Out
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
