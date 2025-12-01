import { useState, useMemo } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { useAuth } from '@/lib/auth-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Trash2, Edit2, Plus, Home, Users, Star, Settings } from 'lucide-react';
import propertiesData from '@/data/properties.json';
import type { Property } from '@/lib/types';

export default function Admin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [properties, setProperties] = useState<Property[]>(propertiesData as Property[]);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [newProperty, setNewProperty] = useState({
    title: '',
    price: 0,
    address: '',
    city: '',
    state: '',
    bedrooms: 0,
    bathrooms: 0,
    listing_type: 'rent' as 'rent' | 'buy' | 'sell',
  });

  // Check if user is admin
  if (!user || user.email !== 'admin@choiceproperties.com') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="p-8 max-w-md text-center border-2 border-red-300">
            <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access the admin panel.</p>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const stats = useMemo(() => {
    const rentals = properties.filter(p => p.listing_type === 'rent').length;
    const sales = properties.filter(p => p.listing_type === 'buy').length;
    const reviews = JSON.parse(localStorage.getItem('choiceProperties_reviews') || '[]');
    const users = JSON.parse(localStorage.getItem('choiceProperties_users') || '[]');
    
    return {
      totalProperties: properties.length,
      rentals,
      sales,
      totalReviews: reviews.length,
      pendingReviews: 0,
      totalUsers: users.length,
      avgRating: reviews.length > 0 ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1) : 0
    };
  }, [properties]);

  const listingData = [
    { name: 'Rentals', value: stats.rentals, fill: '#3b82f6' },
    { name: 'Sales', value: stats.sales, fill: '#10b981' }
  ];

  const handleDeleteProperty = (id: string) => {
    setProperties(properties.filter(p => p.id !== id));
  };

  const handleSaveProperty = () => {
    if (editingProperty) {
      setProperties(properties.map(p => p.id === editingProperty.id ? editingProperty : p));
      setEditingProperty(null);
    } else if (newProperty.title && newProperty.address) {
      const property: Property = {
        id: `prop_${Date.now()}`,
        owner_id: 'admin',
        owner: {
          id: 'admin',
          name: 'Admin',
          slug: 'admin',
          profile_photo_url: '',
          email: 'admin@choiceproperties.com',
          verified: true,
          description: 'Admin',
          created_at: new Date().toISOString()
        },
        title: newProperty.title,
        price: newProperty.price,
        address: newProperty.address,
        city: newProperty.city,
        state: newProperty.state,
        zip: '00000',
        bedrooms: newProperty.bedrooms,
        bathrooms: newProperty.bathrooms,
        sqft: 0,
        year_built: new Date().getFullYear(),
        description: '',
        features: [],
        type: 'House',
        location: newProperty.city,
        images: [],
        featured: false,
        listing_type: newProperty.listing_type,
        status: 'available'
      };
      setProperties([...properties, property]);
      setNewProperty({ title: '', price: 0, address: '', city: '', state: '', bedrooms: 0, bathrooms: 0, listing_type: 'rent' });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="bg-gradient-to-r from-primary to-secondary text-white py-8">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <span className="text-white/80">Welcome, {user?.name}!</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 flex-1">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: '📊' },
            { id: 'properties', label: 'Properties', icon: '🏠' },
            { id: 'users', label: 'Users', icon: '👥' },
            { id: 'reviews', label: 'Reviews', icon: '⭐' },
            { id: 'settings', label: 'Settings', icon: '⚙️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-6 border-t-4 border-t-blue-500">
                <p className="text-gray-600 text-sm font-semibold">Total Properties</p>
                <p className="text-3xl font-bold text-primary">{stats.totalProperties}</p>
              </Card>
              <Card className="p-6 border-t-4 border-t-green-500">
                <p className="text-gray-600 text-sm font-semibold">For Rent</p>
                <p className="text-3xl font-bold text-green-600">{stats.rentals}</p>
              </Card>
              <Card className="p-6 border-t-4 border-t-amber-500">
                <p className="text-gray-600 text-sm font-semibold">For Sale</p>
                <p className="text-3xl font-bold text-amber-600">{stats.sales}</p>
              </Card>
              <Card className="p-6 border-t-4 border-t-purple-500">
                <p className="text-gray-600 text-sm font-semibold">Total Users</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalUsers}</p>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4">Listing Breakdown</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={listingData} cx="50%" cy="50%" labelLine={false} label={{ position: 'insideBottomRight', offset: -10 }} outerRadius={80} fill="#8884d8" dataKey="value">
                      {listingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4">Reviews & Ratings</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-600 text-sm font-semibold">Total Reviews</p>
                    <p className="text-3xl font-bold">{stats.totalReviews}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-semibold">Average Rating</p>
                    <p className="text-3xl font-bold text-yellow-500">{stats.avgRating} ⭐</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Properties Tab */}
        {activeTab === 'properties' && (
          <div className="space-y-6">
            <Card className="p-6 bg-blue-50">
              <h3 className="font-bold text-lg mb-4">Add New Property</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input placeholder="Title" value={newProperty.title} onChange={(e) => setNewProperty({...newProperty, title: e.target.value})} />
                <Input type="number" placeholder="Price" value={newProperty.price} onChange={(e) => setNewProperty({...newProperty, price: parseInt(e.target.value)})} />
                <Input placeholder="Address" value={newProperty.address} onChange={(e) => setNewProperty({...newProperty, address: e.target.value})} />
                <Input placeholder="City" value={newProperty.city} onChange={(e) => setNewProperty({...newProperty, city: e.target.value})} />
                <Input placeholder="State" value={newProperty.state} onChange={(e) => setNewProperty({...newProperty, state: e.target.value})} />
                <select value={newProperty.listing_type} onChange={(e) => setNewProperty({...newProperty, listing_type: e.target.value as any})} className="px-3 py-2 border rounded">
                  <option value="rent">Rent</option>
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </select>
              </div>
              <Button onClick={handleSaveProperty} className="mt-4 bg-primary">
                <Plus className="h-4 w-4 mr-2" /> Add Property
              </Button>
            </Card>

            <div>
              <h3 className="font-bold text-lg mb-4">All Properties ({properties.length})</h3>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {properties.map(prop => (
                  <Card key={prop.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                    <div>
                      <p className="font-semibold">{prop.title}</p>
                      <p className="text-sm text-gray-600">{prop.address}, {prop.city}</p>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{prop.listing_type}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingProperty(prop)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteProperty(prop.id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <Card className="p-6">
            <h3 className="font-bold text-lg mb-4">Registered Users</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {(JSON.parse(localStorage.getItem('choiceProperties_users') || '[]') as any[]).map((u: any) => (
                    <tr key={u.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2 font-semibold">{u.name}</td>
                      <td className="px-4 py-2">{u.email}</td>
                      <td className="px-4 py-2 text-gray-600">{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(JSON.parse(localStorage.getItem('choiceProperties_users') || '[]') as any[]).length === 0 && (
                <p className="text-gray-500 text-center py-4">No users yet</p>
              )}
            </div>
          </Card>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Property Reviews</h3>
            {(JSON.parse(localStorage.getItem('choiceProperties_reviews') || '[]') as any[]).map((review: any) => (
              <Card key={review.id} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold">{review.user_name}</p>
                    <p className="text-sm text-gray-600">Property ID: {review.property_id}</p>
                  </div>
                  <span className="text-yellow-500">{'⭐'.repeat(review.rating)}</span>
                </div>
                <p className="text-gray-700">{review.comment}</p>
                <p className="text-xs text-gray-500 mt-2">{new Date(review.created_at).toLocaleDateString()}</p>
              </Card>
            ))}
            {(JSON.parse(localStorage.getItem('choiceProperties_reviews') || '[]') as any[]).length === 0 && (
              <p className="text-gray-500">No reviews yet</p>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <Card className="p-6 max-w-md">
            <h3 className="font-bold text-lg mb-4">Admin Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="font-semibold">Admin User</span>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm">Connected</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="font-semibold">Email</span>
                <span className="text-gray-600">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="font-semibold">Data Storage</span>
                <span className="text-gray-600">localStorage</span>
              </div>
            </div>
          </Card>
        )}
      </div>

      <Footer />
    </div>
  );
}
