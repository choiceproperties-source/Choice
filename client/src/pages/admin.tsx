import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  Trash2, Edit2, Plus, Home, Users, Star, Settings, FileText, MessageSquare, Shield, 
  Check, X, Bell, LogOut, LayoutDashboard, Search, BarChart3, Menu, ChevronDown
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import {
  getProperties, getAllUsers, getAllReviews, getInquiries, getApplications,
  createProperty, deleteProperty, deleteReview, updateUserRole,
} from '@/lib/supabase-service';

interface Property {
  id: string; title: string; address: string; city: string; state: string;
  price: number; bedrooms: number; bathrooms: number; property_type: string;
  status: string; created_at: string;
}

interface User {
  id: string; email: string; full_name: string; role: string; created_at: string;
}

interface Review {
  id: string; property_id: string; user_id: string; rating: number;
  comment: string; created_at: string;
  users?: { full_name: string; email: string };
  properties?: { title: string };
}

interface Inquiry {
  id: string; sender_name: string; sender_email: string; sender_phone?: string;
  message: string; status: string; created_at: string;
  property_id?: string; properties?: { title: string };
}

interface Application {
  id: string; status: string; created_at: string; user_id?: string;
  property_id?: string; users?: { full_name: string };
  properties?: { title: string };
}

interface SavedSearch {
  id: string; user_id: string; name: string; filters: any;
  created_at: string; users?: { full_name: string; email: string };
}

export default function Admin() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showAddProperty, setShowAddProperty] = useState(false);
  
  const [newProperty, setNewProperty] = useState({
    title: '', price: '', address: '', city: '', state: '',
    bedrooms: '', bathrooms: '', property_type: 'house',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [props, usersData, reviewsData, inqsData, appsData] = await Promise.all([
        getProperties(), getAllUsers(), getAllReviews(), getInquiries(), getApplications()
      ]);
      setProperties(props as any[]);
      setUsers(usersData);
      setReviews(reviewsData);
      setInquiries(inqsData || []);
      setApplications(appsData || []);
      setSavedSearches([]); // Placeholder - would load from API
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast({ title: 'Failed to load data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <Shield className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">You don't have permission to access the admin panel.</p>
          <p className="text-sm text-muted-foreground mb-6">Admin access requires the 'admin' role.</p>
          <Link href="/">
            <Button className="w-full" data-testid="button-go-home">Go to Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const stats = {
    totalProperties: properties.length,
    activeProperties: properties.filter(p => p.status === 'active').length,
    totalUsers: users.length,
    agents: users.filter(u => u.role === 'agent').length,
    totalReviews: reviews.length,
    avgRating: reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : 0,
    pendingApplications: applications.filter(a => a.status === 'pending').length,
    pendingInquiries: inquiries.filter(i => i.status === 'pending').length,
  };

  const handleCreateProperty = async () => {
    if (!user?.id || !newProperty.title || !newProperty.address) {
      toast({ title: 'Please fill in required fields', variant: 'destructive' });
      return;
    }
    
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
      setNewProperty({ title: '', price: '', address: '', city: '', state: '', bedrooms: '', bathrooms: '', property_type: 'house' });
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

  const handleLogout = async () => {
    try {
      await logout();
      setLocation('/');
    } catch (error) {
      toast({ title: 'Logout failed', variant: 'destructive' });
    }
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

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'properties', label: 'Properties', icon: Home },
    { id: 'applications', label: 'Applications', icon: FileText },
    { id: 'inquiries', label: 'Inquiries', icon: MessageSquare },
    { id: 'saved-searches', label: 'Saved Searches', icon: Search },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Header */}
      <header className="lg:hidden bg-background border-b sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            data-testid="button-sidebar-toggle"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="font-bold text-lg">Admin Panel</h1>
          <Button variant="ghost" size="icon" onClick={handleLogout} data-testid="button-logout">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'block' : 'hidden'} lg:block w-full lg:w-64 bg-card border-r fixed lg:static top-16 lg:top-0 left-0 right-0 lg:h-screen overflow-y-auto z-30`}>
        <div className="p-6 space-y-8">
          <div className="hidden lg:block">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin
            </h1>
          </div>

          <nav className="space-y-2">
            {navigationItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveSection(item.id); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                    activeSection === item.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                  data-testid={`nav-${item.id}`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <hr />

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{user?.full_name?.[0]?.toUpperCase() || 'A'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" data-testid="text-admin-name">{user?.full_name || 'Admin'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={handleLogout}
              data-testid="button-logout-sidebar"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20 lg:pb-0">
        <div className="hidden lg:block bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-6 sticky top-0 z-10">
          <div className="px-8 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold capitalize" data-testid="text-section-title">{navigationItems.find(n => n.id === activeSection)?.label || 'Dashboard'}</h2>
              <p className="text-primary-foreground/80 text-sm">Manage your platform</p>
            </div>
            <Badge className="bg-primary-foreground/20">
              <Shield className="h-3 w-3 mr-1" />
              Admin Access
            </Badge>
          </div>
        </div>

        <div className="p-4 lg:p-8 space-y-6">
          {loading && <p className="text-muted-foreground" data-testid="text-loading">Loading data...</p>}

          {/* Dashboard Section */}
          {activeSection === 'dashboard' && !loading && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Home className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total Properties</p>
                        <p className="text-2xl font-bold" data-testid="stat-properties">{stats.totalProperties}</p>
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
                        <p className="text-2xl font-bold" data-testid="stat-users">{stats.totalUsers}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Applications</p>
                        <p className="text-2xl font-bold" data-testid="stat-applications">{applications.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-8 w-8 text-yellow-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Inquiries</p>
                        <p className="text-2xl font-bold" data-testid="stat-inquiries">{inquiries.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Property Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={listingData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
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
            </div>
          )}

          {/* Users Section */}
          {activeSection === 'users' && !loading && (
            <div className="space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <h3 className="text-xl font-semibold">All Users ({users.length})</h3>
              </div>
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
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <Select value={u.role} onValueChange={(newRole) => handleUpdateUserRole(u.id, newRole)}>
                            <SelectTrigger className="w-24 h-8" data-testid={`select-role-${u.id}`}>
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
                {users.length === 0 && <p className="text-muted-foreground text-center py-8">No users found</p>}
              </div>
            </div>
          )}

          {/* Properties Section */}
          {activeSection === 'properties' && !loading && (
            <div className="space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <h3 className="text-xl font-semibold">All Properties ({properties.length})</h3>
                <Button onClick={() => setShowAddProperty(true)} size="sm" data-testid="button-add-property">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Property
                </Button>
              </div>

              {showAddProperty && (
                <Card className="p-6 bg-muted/50">
                  <h4 className="font-semibold mb-4">Add New Property</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input placeholder="Title" value={newProperty.title} onChange={(e) => setNewProperty({...newProperty, title: e.target.value})} data-testid="input-property-title" />
                    <Input type="number" placeholder="Price" value={newProperty.price} onChange={(e) => setNewProperty({...newProperty, price: e.target.value})} data-testid="input-property-price" />
                    <Input placeholder="Address" value={newProperty.address} onChange={(e) => setNewProperty({...newProperty, address: e.target.value})} data-testid="input-property-address" />
                    <Input placeholder="City" value={newProperty.city} onChange={(e) => setNewProperty({...newProperty, city: e.target.value})} data-testid="input-property-city" />
                    <Input placeholder="State" value={newProperty.state} onChange={(e) => setNewProperty({...newProperty, state: e.target.value})} data-testid="input-property-state" />
                    <Select value={newProperty.property_type} onValueChange={(v) => setNewProperty({...newProperty, property_type: v})}>
                      <SelectTrigger data-testid="select-property-type">
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
                    <Button onClick={handleCreateProperty} size="sm" data-testid="button-save-property">Create</Button>
                    <Button variant="outline" size="sm" onClick={() => setShowAddProperty(false)}>Cancel</Button>
                  </div>
                </Card>
              )}

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {properties.map(prop => (
                  <Card key={prop.id} className="p-4" data-testid={`card-property-${prop.id}`}>
                    <div className="flex justify-between items-center gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{prop.title}</p>
                        <p className="text-sm text-muted-foreground">{prop.address}, {prop.city}</p>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          <Badge variant="secondary">{prop.property_type}</Badge>
                          <Badge variant={prop.status === 'active' ? 'default' : 'secondary'}>{prop.status}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" data-testid={`button-edit-property-${prop.id}`}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteProperty(prop.id)} data-testid={`button-delete-property-${prop.id}`}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Applications Section */}
          {activeSection === 'applications' && !loading && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">All Applications ({applications.length})</h3>
              {applications.length === 0 ? (
                <Card className="p-8 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No applications yet</p>
                </Card>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {applications.map((app) => (
                    <Card key={app.id} className="p-4" data-testid={`card-application-${app.id}`}>
                      <div className="flex justify-between items-center gap-4 flex-wrap">
                        <div>
                          <p className="font-medium">Application #{app.id.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">{new Date(app.created_at).toLocaleDateString()}</p>
                        </div>
                        <Badge variant={app.status === 'approved' ? 'default' : app.status === 'rejected' ? 'destructive' : 'secondary'}>
                          {app.status}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Inquiries Section */}
          {activeSection === 'inquiries' && !loading && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">All Inquiries ({inquiries.length})</h3>
              {inquiries.length === 0 ? (
                <Card className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No inquiries yet</p>
                </Card>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {inquiries.map((inq) => (
                    <Card key={inq.id} className="p-4" data-testid={`card-inquiry-${inq.id}`}>
                      <div className="flex justify-between items-start gap-4 flex-wrap">
                        <div className="flex-1">
                          <p className="font-medium">{inq.sender_name}</p>
                          <p className="text-sm text-muted-foreground">{inq.sender_email}</p>
                          {inq.sender_phone && <p className="text-sm text-muted-foreground">{inq.sender_phone}</p>}
                          <p className="text-sm mt-2">{inq.message?.substring(0, 100)}...</p>
                          <p className="text-xs text-muted-foreground mt-2">{new Date(inq.created_at).toLocaleDateString()}</p>
                        </div>
                        <Badge variant={inq.status === 'pending' ? 'secondary' : 'default'}>{inq.status}</Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Saved Searches Section */}
          {activeSection === 'saved-searches' && !loading && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Saved Searches ({savedSearches.length})</h3>
              {savedSearches.length === 0 ? (
                <Card className="p-8 text-center">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No saved searches yet</p>
                </Card>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {savedSearches.map((search) => (
                    <Card key={search.id} className="p-4" data-testid={`card-search-${search.id}`}>
                      <div className="flex justify-between items-center gap-4 flex-wrap">
                        <div>
                          <p className="font-medium">{search.name}</p>
                          <p className="text-sm text-muted-foreground">{search.users?.full_name}</p>
                          <p className="text-xs text-muted-foreground">{new Date(search.created_at).toLocaleDateString()}</p>
                        </div>
                        <Button variant="outline" size="sm" data-testid={`button-delete-search-${search.id}`}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Analytics Section */}
          {activeSection === 'analytics' && !loading && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground mb-2">Active Properties</p>
                    <p className="text-3xl font-bold">{stats.activeProperties}</p>
                    <p className="text-xs text-muted-foreground mt-2">{Math.round((stats.activeProperties / stats.totalProperties) * 100)}% of total</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground mb-2">Pending Applications</p>
                    <p className="text-3xl font-bold">{stats.pendingApplications}</p>
                    <p className="text-xs text-muted-foreground mt-2">Awaiting review</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground mb-2">Avg Review Rating</p>
                    <p className="text-3xl font-bold">{stats.avgRating}</p>
                    <p className="text-xs text-muted-foreground mt-2">From {stats.totalReviews} reviews</p>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Property Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[{ name: 'Properties', active: stats.activeProperties, inactive: stats.totalProperties - stats.activeProperties }]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="active" fill="hsl(var(--primary))" />
                      <Bar dataKey="inactive" fill="hsl(var(--muted))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
