import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  Trash2, 
  Edit2, 
  Plus, 
  Home, 
  Users, 
  Star, 
  Settings, 
  FileText, 
  MessageSquare,
  Shield,
  Check,
  X
} from 'lucide-react';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import {
  getProperties,
  getAllUsers,
  getAllReviews,
  getInquiries,
  getApplications,
  createProperty,
  updateProperty,
  deleteProperty,
  deleteReview,
  updateUserRole,
  getAdminStats,
} from '@/lib/supabase-service';

interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  state: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  property_type: string;
  status: string;
  created_at: string;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

interface Review {
  id: string;
  property_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  users?: { full_name: string; email: string };
  properties?: { title: string };
}

interface Inquiry {
  id: string;
  sender_name: string;
  sender_email: string;
  message: string;
  status: string;
  created_at: string;
}

interface Application {
  id: string;
  status: string;
  created_at: string;
}

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [showAddProperty, setShowAddProperty] = useState(false);
  
  const [newProperty, setNewProperty] = useState({
    title: '',
    price: '',
    address: '',
    city: '',
    state: '',
    bedrooms: '',
    bathrooms: '',
    property_type: 'house',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [props, usersData, reviewsData, inqsData, appsData] = await Promise.all([
        getProperties(),
        getAllUsers(),
        getAllReviews(),
        getInquiries(),
        getApplications()
      ]);
      setProperties(props as any[]);
      setUsers(usersData);
      setReviews(reviewsData);
      setInquiries(inqsData);
      setApplications(appsData);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="p-8 max-w-md text-center">
            <Shield className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">You don't have permission to access the admin panel.</p>
            <p className="text-sm text-muted-foreground">Admin access requires the 'admin' role.</p>
            <Link href="/">
              <Button className="mt-4" data-testid="button-go-home">Go to Home</Button>
            </Link>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const stats = {
    totalProperties: properties.length,
    activeProperties: properties.filter(p => p.status === 'active').length,
    totalUsers: users.length,
    agents: users.filter(u => u.role === 'agent').length,
    totalReviews: reviews.length,
    avgRating: reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) 
      : 0,
    pendingApplications: applications.filter(a => a.status === 'pending').length,
    pendingInquiries: inquiries.filter(i => i.status === 'pending').length,
  };

  const listingData = [
    { name: 'Active', value: stats.activeProperties, fill: 'hsl(var(--primary))' },
    { name: 'Inactive', value: stats.totalProperties - stats.activeProperties, fill: 'hsl(var(--muted))' }
  ];

  const userRoleData = [
    { name: 'Users', value: users.filter(u => u.role === 'user').length, fill: 'hsl(var(--primary))' },
    { name: 'Agents', value: stats.agents, fill: 'hsl(var(--chart-2))' },
    { name: 'Admins', value: users.filter(u => u.role === 'admin').length, fill: 'hsl(var(--chart-3))' }
  ];

  const handleCreateProperty = async () => {
    if (!user?.id) return;
    
    const propertyData = {
      owner_id: user.id,
      title: newProperty.title,
      address: newProperty.address,
      city: newProperty.city,
      state: newProperty.state,
      price: parseFloat(newProperty.price) || 0,
      bedrooms: parseInt(newProperty.bedrooms) || 0,
      bathrooms: parseFloat(newProperty.bathrooms) || 0,
      property_type: newProperty.property_type,
      status: 'active',
    };

    const result = await createProperty(propertyData as any);
    if (result) {
      toast({ title: 'Property created successfully' });
      setShowAddProperty(false);
      setNewProperty({
        title: '', price: '', address: '', city: '', state: '',
        bedrooms: '', bathrooms: '', property_type: 'house',
      });
      loadData();
    } else {
      toast({ title: 'Failed to create property', variant: 'destructive' });
    }
  };

  const handleDeleteProperty = async (id: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;
    
    const result = await deleteProperty(id);
    if (result) {
      toast({ title: 'Property deleted' });
      loadData();
    } else {
      toast({ title: 'Failed to delete property', variant: 'destructive' });
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    
    const result = await deleteReview(id);
    if (result) {
      toast({ title: 'Review deleted' });
      loadData();
    } else {
      toast({ title: 'Failed to delete review', variant: 'destructive' });
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    const result = await updateUserRole(userId, newRole);
    if (result) {
      toast({ title: `User role updated to ${newRole}` });
      loadData();
    } else {
      toast({ title: 'Failed to update user role', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-8">
        <div className="container mx-auto px-4 flex justify-between items-center gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">Admin Dashboard</h1>
            <p className="text-primary-foreground/80">Manage your platform</p>
          </div>
          <Badge variant="outline" className="bg-primary-foreground/10 text-primary-foreground">
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 flex-1">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="flex flex-wrap gap-1">
            <TabsTrigger value="dashboard" data-testid="tab-dashboard">
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="properties" data-testid="tab-properties">
              <Home className="h-4 w-4 mr-2" />
              Properties
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="reviews" data-testid="tab-reviews">
              <Star className="h-4 w-4 mr-2" />
              Reviews
            </TabsTrigger>
            <TabsTrigger value="applications" data-testid="tab-applications">
              <FileText className="h-4 w-4 mr-2" />
              Applications
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Home className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Properties</p>
                      <p className="text-2xl font-bold" data-testid="text-total-properties">{stats.totalProperties}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Users</p>
                      <p className="text-2xl font-bold" data-testid="text-total-users">{stats.totalUsers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Star className="h-8 w-8 text-yellow-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Rating</p>
                      <p className="text-2xl font-bold" data-testid="text-avg-rating">{stats.avgRating}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Pending Apps</p>
                      <p className="text-2xl font-bold" data-testid="text-pending-apps">{stats.pendingApplications}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Property Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie 
                        data={listingData} 
                        cx="50%" 
                        cy="50%" 
                        outerRadius={80} 
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {listingData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Roles</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={userRoleData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="properties" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">All Properties ({properties.length})</h2>
              <Button onClick={() => setShowAddProperty(true)} data-testid="button-add-property">
                <Plus className="h-4 w-4 mr-2" />
                Add Property
              </Button>
            </div>

            {showAddProperty && (
              <Card className="p-6 bg-muted/50">
                <h3 className="font-semibold mb-4">Add New Property</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Title"
                    value={newProperty.title}
                    onChange={(e) => setNewProperty({...newProperty, title: e.target.value})}
                    data-testid="input-title"
                  />
                  <Input
                    type="number"
                    placeholder="Price"
                    value={newProperty.price}
                    onChange={(e) => setNewProperty({...newProperty, price: e.target.value})}
                    data-testid="input-price"
                  />
                  <Input
                    placeholder="Address"
                    value={newProperty.address}
                    onChange={(e) => setNewProperty({...newProperty, address: e.target.value})}
                    data-testid="input-address"
                  />
                  <Input
                    placeholder="City"
                    value={newProperty.city}
                    onChange={(e) => setNewProperty({...newProperty, city: e.target.value})}
                    data-testid="input-city"
                  />
                  <Input
                    placeholder="State"
                    value={newProperty.state}
                    onChange={(e) => setNewProperty({...newProperty, state: e.target.value})}
                    data-testid="input-state"
                  />
                  <Select
                    value={newProperty.property_type}
                    onValueChange={(v) => setNewProperty({...newProperty, property_type: v})}
                  >
                    <SelectTrigger data-testid="select-type">
                      <SelectValue placeholder="Property Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="house">House</SelectItem>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="condo">Condo</SelectItem>
                      <SelectItem value="townhouse">Townhouse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleCreateProperty} data-testid="button-save-property">Create</Button>
                  <Button variant="outline" onClick={() => setShowAddProperty(false)}>Cancel</Button>
                </div>
              </Card>
            )}

            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {properties.map(prop => (
                  <Card key={prop.id} className="p-4" data-testid={`card-property-${prop.id}`}>
                    <div className="flex justify-between items-center gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{prop.title}</p>
                        <p className="text-sm text-muted-foreground">{prop.address}, {prop.city}</p>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          <Badge variant="secondary">{prop.property_type}</Badge>
                          <Badge variant={prop.status === 'active' ? 'default' : 'secondary'}>
                            {prop.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingProperty(prop)}
                          data-testid={`button-edit-${prop.id}`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteProperty(prop.id)}
                          data-testid={`button-delete-${prop.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <h2 className="text-xl font-semibold">All Users ({users.length})</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-left">Joined</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t" data-testid={`row-user-${u.id}`}>
                      <td className="px-4 py-3 font-medium">{u.full_name || 'N/A'}</td>
                      <td className="px-4 py-3">{u.email}</td>
                      <td className="px-4 py-3">
                        <Badge variant={u.role === 'admin' ? 'default' : u.role === 'agent' ? 'secondary' : 'outline'}>
                          {u.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={u.role}
                          onValueChange={(newRole) => handleUpdateUserRole(u.id, newRole)}
                        >
                          <SelectTrigger className="w-28" data-testid={`select-role-${u.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="agent">Agent</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <p className="text-muted-foreground text-center py-8">No users found</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            <h2 className="text-xl font-semibold">All Reviews ({reviews.length})</h2>
            
            {reviews.length === 0 ? (
              <Card className="p-8 text-center">
                <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No reviews yet</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review.id} className="p-4" data-testid={`card-review-${review.id}`}>
                    <div className="flex justify-between items-start gap-4 flex-wrap">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="font-semibold">
                            {review.users?.full_name || 'Anonymous'}
                          </span>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Property: {review.properties?.title || review.property_id}
                        </p>
                        <p className="text-sm">{review.comment}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteReview(review.id)}
                        data-testid={`button-delete-review-${review.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="applications" className="space-y-4">
            <h2 className="text-xl font-semibold">All Applications ({applications.length})</h2>
            
            {applications.length === 0 ? (
              <Card className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No applications yet</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {applications.map((app) => (
                  <Card key={app.id} className="p-4" data-testid={`card-application-${app.id}`}>
                    <div className="flex justify-between items-center gap-4 flex-wrap">
                      <div>
                        <p className="font-medium">Application #{app.id.slice(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(app.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={
                        app.status === 'approved' ? 'default' :
                        app.status === 'rejected' ? 'destructive' : 'secondary'
                      }>
                        {app.status}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <h2 className="text-xl font-semibold">Settings</h2>
            
            <Card className="p-6 max-w-md">
              <h3 className="font-semibold mb-4">Admin Information</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-md gap-2">
                  <span className="font-medium">Admin Email</span>
                  <span className="text-muted-foreground text-sm">{user?.email}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-md gap-2">
                  <span className="font-medium">Role</span>
                  <Badge>{user?.role}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-md gap-2">
                  <span className="font-medium">Database</span>
                  <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                    <Check className="h-3 w-3 mr-1" />
                    Supabase Connected
                  </Badge>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}
