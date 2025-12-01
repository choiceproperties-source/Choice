import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { useAuth } from '@/lib/auth-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Heart, Save, TrendingUp, Calculator, LogOut, MapPin, DollarSign, Bed, Bath } from 'lucide-react';
import propertiesData from '@/data/properties.json';
import type { Property } from '@/lib/types';

export default function BuyerDashboard() {
  const { user, logout, isLoggedIn } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('wishlist');

  if (!isLoggedIn || !user) {
    navigate('/login');
    return null;
  }

  // Get wishlist
  const wishlist = useMemo(() => {
    const favIds = JSON.parse(localStorage.getItem('choiceProperties_favorites') || '[]');
    const allProps = propertiesData as Property[];
    return allProps.filter(p => p.listing_type === 'buy' && favIds.includes(p.id));
  }, []);

  // Get saved searches
  const savedSearches = useMemo(() => {
    return JSON.parse(localStorage.getItem('choiceProperties_savedSearches') || '[]');
  }, []);

  // Get mortgage calculations
  const mortgageCalcs = useMemo(() => {
    return JSON.parse(localStorage.getItem('choiceProperties_mortgageCalcs') || '[]');
  }, []);

  // Simulated market trend data
  const marketTrends = [
    { month: 'Jan', avgPrice: 450000 },
    { month: 'Feb', avgPrice: 455000 },
    { month: 'Mar', avgPrice: 460000 },
    { month: 'Apr', avgPrice: 458000 },
    { month: 'May', avgPrice: 465000 },
    { month: 'Jun', avgPrice: 470000 },
    { month: 'Jul', avgPrice: 472000 },
    { month: 'Aug', avgPrice: 475000 }
  ];

  const stats = {
    wishlistItems: wishlist.length,
    savedSearches: savedSearches.length,
    calculationsSaved: mortgageCalcs.length,
    avgPriceInWishlist: wishlist.length > 0 ? Math.round(wishlist.reduce((sum, p) => sum + (p.price || 0), 0) / wishlist.length) : 0
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-12">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">Buyer Dashboard</h1>
            <p className="text-white/80 mt-2">Track your favorite properties and home search progress</p>
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

      {/* Stats */}
      <div className="container mx-auto px-4 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-white">
            <p className="text-gray-600 text-sm font-semibold">Wishlist Items</p>
            <p className="text-3xl font-bold text-blue-600">{stats.wishlistItems}</p>
            <Heart className="h-4 w-4 text-red-500 mt-2" />
          </Card>
          <Card className="p-4 bg-white">
            <p className="text-gray-600 text-sm font-semibold">Saved Searches</p>
            <p className="text-3xl font-bold text-purple-600">{stats.savedSearches}</p>
          </Card>
          <Card className="p-4 bg-white">
            <p className="text-gray-600 text-sm font-semibold">Avg Price (Wishlist)</p>
            <p className="text-2xl font-bold text-green-600">
              ${Math.round(stats.avgPriceInWishlist / 1000)}k
            </p>
          </Card>
          <Card className="p-4 bg-white">
            <p className="text-gray-600 text-sm font-semibold">Calc. Saved</p>
            <p className="text-3xl font-bold text-orange-600">{stats.calculationsSaved}</p>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 mt-12 flex-1">
        <div className="flex gap-2 mb-8 flex-wrap border-b">
          {[
            { id: 'wishlist', label: 'Wishlist', icon: '❤️' },
            { id: 'searches', label: 'Saved Searches', icon: '🔍' },
            { id: 'market', label: 'Market Insights', icon: '📈' },
            { id: 'profile', label: 'Profile', icon: '👤' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-semibold transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-b-blue-600 text-blue-600'
                  : 'border-b-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Wishlist */}
        {activeTab === 'wishlist' && (
          <div className="pb-12">
            {wishlist.length === 0 ? (
              <Card className="p-12 text-center">
                <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-semibold">No properties in your wishlist yet</p>
                <p className="text-gray-500 text-sm mt-2">Browse properties and add your favorites to track them here</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {wishlist.map(property => (
                  <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video bg-gray-200 relative">
                      <img
                        src={`https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop`}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                      <Badge className="absolute top-3 right-3 bg-blue-600">For Sale</Badge>
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
                      <div className="flex justify-between items-center mb-4">
                        <p className="font-bold text-blue-600 text-lg">
                          ${property.price?.toLocaleString()}
                        </p>
                        <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                      </div>
                      <Button className="w-full bg-blue-600 text-white">View Details</Button>
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
                <Save className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-semibold">No saved searches yet</p>
                <p className="text-gray-500 text-sm mt-2">Save your search filters to quickly revisit your home buying criteria</p>
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
                      </div>
                      <p className="text-xs text-gray-500 mt-3">
                        Saved: {new Date(search.savedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button className="bg-blue-600">View Results</Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Market Insights */}
        {activeTab === 'market' && (
          <div className="space-y-8 pb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Market Price Trends (Last 8 Months)
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={marketTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${value?.toLocaleString()}`} />
                    <Line
                      type="monotone"
                      dataKey="avgPrice"
                      stroke="#3b82f6"
                      dot={{ r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4">Buying Tips</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="font-semibold text-blue-900 text-sm">📋 Get Pre-Approved</p>
                    <p className="text-xs text-blue-800 mt-1">Having pre-approval strengthens your offer</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="font-semibold text-green-900 text-sm">🏠 Home Inspection</p>
                    <p className="text-xs text-green-800 mt-1">Always get a professional inspection before buying</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="font-semibold text-purple-900 text-sm">💰 Compare Rates</p>
                    <p className="text-xs text-purple-800 mt-1">Shop around for the best mortgage rates</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <p className="font-semibold text-orange-900 text-sm">⚖️ Review Terms</p>
                    <p className="text-xs text-orange-800 mt-1">Understand all terms before signing</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Profile */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl pb-12">
            <Card className="p-8">
              <div className="flex items-center gap-4 mb-8 pb-8 border-b">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
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
                  <p className="text-sm text-gray-600 font-semibold">Wishlist Items</p>
                  <p className="text-lg font-semibold text-blue-600 mt-1">{stats.wishlistItems}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Saved Searches</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">{stats.savedSearches}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Saved Calculations</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">{stats.calculationsSaved}</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Your Buying Journey</h3>
                <div className="text-sm text-gray-700 space-y-2">
                  <p>✓ Browsing properties</p>
                  <p>○ Pre-approval (Ready to get started?)</p>
                  <p>○ Make an offer</p>
                  <p>○ Close the deal</p>
                </div>
              </div>

              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  📞 Contact an Agent (Coming Soon)
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
