import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { useAuth } from '@/lib/auth-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Plus, Edit2, Trash2, Eye, Home, TrendingUp, Users, LogOut } from 'lucide-react';
import propertiesData from '@/data/properties.json';
import type { Property } from '@/lib/types';

export default function SellerDashboard() {
  const { user, logout, isLoggedIn } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('listings');
  const [listings, setListings] = useState<Property[]>(propertiesData as Property[]);
  const [editingListing, setEditingListing] = useState<Property | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newListing, setNewListing] = useState({
    title: '',
    address: '',
    city: '',
    state: '',
    price: 0,
    bedrooms: 1,
    bathrooms: 1,
    listing_type: 'rent' as 'rent' | 'buy' | 'sell'
  });

  if (!isLoggedIn || !user) {
    navigate('/login');
    return null;
  }

  // Simulated listing performance data
  const listingPerformance = useMemo(() => {
    return listings.map(p => ({
      title: p.title.substring(0, 20),
      views: Math.floor(Math.random() * 500) + 50,
      inquiries: Math.floor(Math.random() * 30) + 5,
      id: p.id
    }));
  }, [listings]);

  const stats = {
    activeListings: listings.length,
    totalViews: listingPerformance.reduce((sum, p) => sum + p.views, 0),
    totalInquiries: listingPerformance.reduce((sum, p) => sum + p.inquiries, 0),
    avgViewsPerListing: Math.round(listingPerformance.reduce((sum, p) => sum + p.views, 0) / Math.max(listings.length, 1))
  };

  const listingTypeData = [
    { name: 'For Rent', value: listings.filter(p => p.listing_type === 'rent').length, fill: '#3b82f6' },
    { name: 'For Sale', value: listings.filter(p => p.listing_type === 'buy').length, fill: '#10b981' },
    { name: 'Selling', value: listings.filter(p => p.listing_type === 'sell').length, fill: '#f59e0b' }
  ];

  const handleAddListing = () => {
    if (!newListing.title || !newListing.address) return;
    const property: Property = {
      id: `prop_${Date.now()}`,
      owner_id: user.id,
      owner: {
        id: user.id,
        name: user.name,
        slug: user.name.toLowerCase().replace(/\s+/g, '-'),
        profile_photo_url: '',
        email: user.email,
        verified: false,
        description: '',
        created_at: new Date().toISOString()
      },
      title: newListing.title,
      price: newListing.price,
      address: newListing.address,
      city: newListing.city,
      state: newListing.state,
      zip: '00000',
      bedrooms: newListing.bedrooms,
      bathrooms: newListing.bathrooms,
      sqft: 0,
      year_built: new Date().getFullYear(),
      description: '',
      features: [],
      type: 'House',
      location: newListing.city,
      images: [],
      featured: false,
      listing_type: newListing.listing_type,
      status: 'available'
    };
    setListings([...listings, property]);
    setNewListing({ title: '', address: '', city: '', state: '', price: 0, bedrooms: 1, bathrooms: 1, listing_type: 'rent' });
    setShowNewForm(false);
  };

  const handleDeleteListing = (id: string) => {
    setListings(listings.filter(p => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-12">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">Property Manager Dashboard</h1>
            <p className="text-white/80 mt-2">Manage your listings and track performance</p>
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
            <p className="text-gray-600 text-sm font-semibold">Active Listings</p>
            <p className="text-3xl font-bold text-green-600">{stats.activeListings}</p>
          </Card>
          <Card className="p-4 bg-white">
            <p className="text-gray-600 text-sm font-semibold">Total Views</p>
            <p className="text-3xl font-bold text-blue-600">{stats.totalViews}</p>
          </Card>
          <Card className="p-4 bg-white">
            <p className="text-gray-600 text-sm font-semibold">Inquiries</p>
            <p className="text-3xl font-bold text-purple-600">{stats.totalInquiries}</p>
          </Card>
          <Card className="p-4 bg-white">
            <p className="text-gray-600 text-sm font-semibold">Avg Views/Listing</p>
            <p className="text-3xl font-bold text-orange-600">{stats.avgViewsPerListing}</p>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 mt-12 flex-1">
        <div className="flex gap-2 mb-8 flex-wrap border-b">
          {[
            { id: 'listings', label: 'My Listings', icon: '🏠' },
            { id: 'performance', label: 'Performance', icon: '📊' },
            { id: 'profile', label: 'Profile', icon: '👤' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-semibold transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-b-green-600 text-green-600'
                  : 'border-b-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* My Listings */}
        {activeTab === 'listings' && (
          <div className="space-y-6 pb-12">
            {!showNewForm ? (
              <Button onClick={() => setShowNewForm(true)} className="bg-green-600">
                <Plus className="h-4 w-4 mr-2" /> Add New Listing
              </Button>
            ) : (
              <Card className="p-6 bg-green-50 border-green-200">
                <h3 className="font-bold text-lg mb-4">Create New Listing</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Property Title"
                    value={newListing.title}
                    onChange={(e) => setNewListing({...newListing, title: e.target.value})}
                  />
                  <Input
                    placeholder="Address"
                    value={newListing.address}
                    onChange={(e) => setNewListing({...newListing, address: e.target.value})}
                  />
                  <Input
                    placeholder="City"
                    value={newListing.city}
                    onChange={(e) => setNewListing({...newListing, city: e.target.value})}
                  />
                  <Input
                    placeholder="State"
                    value={newListing.state}
                    onChange={(e) => setNewListing({...newListing, state: e.target.value})}
                  />
                  <Input
                    type="number"
                    placeholder="Price"
                    value={newListing.price}
                    onChange={(e) => setNewListing({...newListing, price: parseInt(e.target.value)})}
                  />
                  <Input
                    type="number"
                    placeholder="Bedrooms"
                    value={newListing.bedrooms}
                    onChange={(e) => setNewListing({...newListing, bedrooms: parseInt(e.target.value)})}
                  />
                  <Input
                    type="number"
                    placeholder="Bathrooms"
                    value={newListing.bathrooms}
                    onChange={(e) => setNewListing({...newListing, bathrooms: parseInt(e.target.value)})}
                  />
                  <select
                    value={newListing.listing_type}
                    onChange={(e) => setNewListing({...newListing, listing_type: e.target.value as any})}
                    className="px-3 py-2 border rounded"
                  >
                    <option value="rent">For Rent</option>
                    <option value="buy">For Sale</option>
                    <option value="sell">Selling</option>
                  </select>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleAddListing} className="bg-green-600">Create Listing</Button>
                  <Button onClick={() => setShowNewForm(false)} variant="outline">Cancel</Button>
                </div>
              </Card>
            )}

            <div className="grid gap-4">
              {listings.map(listing => (
                <Card key={listing.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900">{listing.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{listing.address}, {listing.city}, {listing.state}</p>
                      <div className="flex gap-2 mt-3">
                        <Badge className="bg-green-100 text-green-800">${listing.price?.toLocaleString()}</Badge>
                        <Badge className={listing.listing_type === 'rent' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}>
                          {listing.listing_type === 'rent' ? '🔑 Rent' : listing.listing_type === 'buy' ? '🏠 Buy' : '📍 Sell'}
                        </Badge>
                        <Badge className="bg-purple-100 text-purple-800">{listing.bedrooms} bed • {listing.bathrooms} bath</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingListing(listing)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteListing(listing.id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Performance */}
        {activeTab === 'performance' && (
          <div className="space-y-8 pb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4">Views & Inquiries by Listing</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={listingPerformance.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="title" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="views" fill="#3b82f6" name="Views" />
                    <Bar dataKey="inquiries" fill="#10b981" name="Inquiries" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4">Listing Type Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={listingTypeData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value">
                      {listingTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </div>
        )}

        {/* Profile */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl pb-12">
            <Card className="p-8">
              <div className="flex items-center gap-4 mb-8 pb-8 border-b">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold">
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
                  <p className="text-sm text-gray-600 font-semibold">Active Listings</p>
                  <p className="text-lg font-semibold text-green-600 mt-1">{stats.activeListings}</p>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Verification Status</h3>
                <Badge className="bg-blue-100 text-blue-800">Not Verified (Coming Soon)</Badge>
                <p className="text-sm text-gray-700 mt-3">
                  Verify your account to increase buyer/renter confidence and visibility.
                </p>
              </div>

              <Button variant="outline" className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50">
                🚪 Sign Out
              </Button>
            </Card>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
