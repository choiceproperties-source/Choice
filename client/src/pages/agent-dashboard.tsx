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
import { 
  Home, 
  Users, 
  MessageSquare, 
  FileText, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  MapPin,
  Check,
  X,
  Clock,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import {
  getAgentProperties,
  getApplicationsForProperty,
  getAgentInquiries,
  createProperty,
  updateProperty,
  deleteProperty,
  updateApplication,
  updateInquiryStatus,
  uploadPropertyImage,
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
  images: string[];
  created_at: string;
}

interface Application {
  id: string;
  property_id: string;
  user_id: string;
  personal_info: any;
  status: string;
  created_at: string;
}

interface Inquiry {
  id: string;
  property_id: string;
  sender_name: string;
  sender_email: string;
  sender_phone: string;
  message: string;
  status: string;
  created_at: string;
}

export default function AgentDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPropertyForApps, setSelectedPropertyForApps] = useState<string | null>(null);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [newProperty, setNewProperty] = useState({
    title: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    price: '',
    bedrooms: '',
    bathrooms: '',
    square_feet: '',
    property_type: 'house',
    description: '',
    amenities: [] as string[],
    pets_allowed: false,
    furnished: false,
  });

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [props, inqs] = await Promise.all([
        getAgentProperties(user.id),
        getAgentInquiries(user.id)
      ]);
      setProperties(props);
      setInquiries(inqs);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadApplicationsForProperty = async (propertyId: string) => {
    setSelectedPropertyForApps(propertyId);
    const apps = await getApplicationsForProperty(propertyId);
    setApplications(apps);
  };

  const handleCreateProperty = async () => {
    if (!user?.id) return;
    
    const propertyData = {
      owner_id: user.id,
      title: newProperty.title,
      address: newProperty.address,
      city: newProperty.city,
      state: newProperty.state,
      zip_code: newProperty.zip_code,
      price: parseFloat(newProperty.price) || 0,
      bedrooms: parseInt(newProperty.bedrooms) || 0,
      bathrooms: parseFloat(newProperty.bathrooms) || 0,
      square_feet: parseInt(newProperty.square_feet) || 0,
      property_type: newProperty.property_type,
      description: newProperty.description,
      amenities: newProperty.amenities,
      pets_allowed: newProperty.pets_allowed,
      furnished: newProperty.furnished,
      status: 'active',
      images: [],
    };

    const result = await createProperty(propertyData as any);
    if (result) {
      toast({ title: 'Property created successfully' });
      setShowAddProperty(false);
      setNewProperty({
        title: '', address: '', city: '', state: '', zip_code: '',
        price: '', bedrooms: '', bathrooms: '', square_feet: '',
        property_type: 'house', description: '', amenities: [],
        pets_allowed: false, furnished: false,
      });
      loadData();
    } else {
      toast({ title: 'Failed to create property', variant: 'destructive' });
    }
  };

  const handleUpdateProperty = async () => {
    if (!editingProperty) return;
    
    const result = await updateProperty(editingProperty.id, editingProperty);
    if (result) {
      toast({ title: 'Property updated successfully' });
      setEditingProperty(null);
      loadData();
    } else {
      toast({ title: 'Failed to update property', variant: 'destructive' });
    }
  };

  const handleDeleteProperty = async (id: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;
    
    const result = await deleteProperty(id);
    if (result) {
      toast({ title: 'Property deleted successfully' });
      loadData();
    } else {
      toast({ title: 'Failed to delete property', variant: 'destructive' });
    }
  };

  const handleUpdateApplicationStatus = async (appId: string, status: string) => {
    const result = await updateApplication(appId, { status });
    if (result) {
      toast({ title: `Application ${status}` });
      if (selectedPropertyForApps) {
        loadApplicationsForProperty(selectedPropertyForApps);
      }
    }
  };

  const handleUpdateInquiryStatus = async (inquiryId: string, status: string) => {
    const result = await updateInquiryStatus(inquiryId, status);
    if (result) {
      toast({ title: 'Inquiry updated' });
      loadData();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, propertyId: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const url = await uploadPropertyImage(files[i], propertyId);
      if (url) {
        uploadedUrls.push(url);
      }
    }

    if (uploadedUrls.length > 0) {
      const property = properties.find(p => p.id === propertyId);
      if (property) {
        const newImages = [...(property.images || []), ...uploadedUrls];
        await updateProperty(propertyId, { images: newImages });
        toast({ title: `${uploadedUrls.length} images uploaded` });
        loadData();
      }
    }

    setUploadingImages(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="p-8 max-w-md text-center">
            <h2 className="text-2xl font-bold mb-2">Please Log In</h2>
            <p className="text-muted-foreground mb-4">You need to be logged in to access the agent dashboard.</p>
            <Link href="/login">
              <Button data-testid="link-login">Log In</Button>
            </Link>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const stats = {
    totalProperties: properties.length,
    activeListings: properties.filter(p => p.status === 'active').length,
    pendingInquiries: inquiries.filter(i => i.status === 'pending').length,
    totalInquiries: inquiries.length,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Agent Dashboard</h1>
          <p className="text-primary-foreground/80">Manage your properties, applications, and inquiries</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
                <Check className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Active Listings</p>
                  <p className="text-2xl font-bold" data-testid="text-active-listings">{stats.activeListings}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Pending Inquiries</p>
                  <p className="text-2xl font-bold" data-testid="text-pending-inquiries">{stats.pendingInquiries}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Inquiries</p>
                  <p className="text-2xl font-bold" data-testid="text-total-inquiries">{stats.totalInquiries}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="properties" className="space-y-4">
          <TabsList>
            <TabsTrigger value="properties" data-testid="tab-properties">
              <Home className="h-4 w-4 mr-2" />
              Properties
            </TabsTrigger>
            <TabsTrigger value="applications" data-testid="tab-applications">
              <FileText className="h-4 w-4 mr-2" />
              Applications
            </TabsTrigger>
            <TabsTrigger value="inquiries" data-testid="tab-inquiries">
              <MessageSquare className="h-4 w-4 mr-2" />
              Inquiries
            </TabsTrigger>
          </TabsList>

          <TabsContent value="properties" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Your Properties</h2>
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
                    placeholder="Property Title"
                    value={newProperty.title}
                    onChange={(e) => setNewProperty({...newProperty, title: e.target.value})}
                    data-testid="input-property-title"
                  />
                  <Input
                    placeholder="Address"
                    value={newProperty.address}
                    onChange={(e) => setNewProperty({...newProperty, address: e.target.value})}
                    data-testid="input-property-address"
                  />
                  <Input
                    placeholder="City"
                    value={newProperty.city}
                    onChange={(e) => setNewProperty({...newProperty, city: e.target.value})}
                    data-testid="input-property-city"
                  />
                  <Input
                    placeholder="State"
                    value={newProperty.state}
                    onChange={(e) => setNewProperty({...newProperty, state: e.target.value})}
                    data-testid="input-property-state"
                  />
                  <Input
                    type="number"
                    placeholder="Price"
                    value={newProperty.price}
                    onChange={(e) => setNewProperty({...newProperty, price: e.target.value})}
                    data-testid="input-property-price"
                  />
                  <Select
                    value={newProperty.property_type}
                    onValueChange={(v) => setNewProperty({...newProperty, property_type: v})}
                  >
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
                  <Input
                    type="number"
                    placeholder="Bedrooms"
                    value={newProperty.bedrooms}
                    onChange={(e) => setNewProperty({...newProperty, bedrooms: e.target.value})}
                    data-testid="input-property-bedrooms"
                  />
                  <Input
                    type="number"
                    placeholder="Bathrooms"
                    value={newProperty.bathrooms}
                    onChange={(e) => setNewProperty({...newProperty, bathrooms: e.target.value})}
                    data-testid="input-property-bathrooms"
                  />
                  <Textarea
                    placeholder="Description"
                    className="md:col-span-2"
                    value={newProperty.description}
                    onChange={(e) => setNewProperty({...newProperty, description: e.target.value})}
                    data-testid="input-property-description"
                  />
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleCreateProperty} data-testid="button-save-property">
                    Create Property
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddProperty(false)} data-testid="button-cancel-add">
                    Cancel
                  </Button>
                </div>
              </Card>
            )}

            {loading ? (
              <p className="text-muted-foreground">Loading properties...</p>
            ) : properties.length === 0 ? (
              <Card className="p-8 text-center">
                <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No Properties Yet</h3>
                <p className="text-muted-foreground mb-4">Start by adding your first property listing.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {properties.map((property) => (
                  <Card key={property.id} className="overflow-hidden" data-testid={`card-property-${property.id}`}>
                    <div className="h-48 bg-muted flex items-center justify-center">
                      {property.images && property.images.length > 0 ? (
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center">
                          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                          <label className="cursor-pointer">
                            <span className="text-sm text-primary">Upload Images</span>
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleImageUpload(e, property.id)}
                              disabled={uploadingImages}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{property.title}</h3>
                        <Badge variant={property.status === 'active' ? 'default' : 'secondary'}>
                          {property.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        <MapPin className="h-3 w-3 inline mr-1" />
                        {property.address}, {property.city}
                      </p>
                      <p className="text-lg font-bold text-primary mb-3">
                        ${property.price?.toLocaleString()}/mo
                      </p>
                      <div className="flex gap-1 text-sm text-muted-foreground mb-4">
                        <span>{property.bedrooms} bed</span>
                        <span>|</span>
                        <span>{property.bathrooms} bath</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => loadApplicationsForProperty(property.id)}
                          data-testid={`button-view-apps-${property.id}`}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Apps
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingProperty(property)}
                          data-testid={`button-edit-${property.id}`}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteProperty(property.id)}
                          data-testid={`button-delete-${property.id}`}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="applications" className="space-y-4">
            <h2 className="text-xl font-semibold">Applications</h2>
            
            {selectedPropertyForApps ? (
              <div>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedPropertyForApps(null)}
                  className="mb-4"
                  data-testid="button-back-to-properties"
                >
                  Back to all properties
                </Button>
                
                {applications.length === 0 ? (
                  <Card className="p-8 text-center">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">No Applications</h3>
                    <p className="text-muted-foreground">This property hasn't received any applications yet.</p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {applications.map((app) => (
                      <Card key={app.id} className="p-4" data-testid={`card-application-${app.id}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">
                              {app.personal_info?.firstName} {app.personal_info?.lastName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              <Mail className="h-3 w-3 inline mr-1" />
                              {app.personal_info?.email}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <Phone className="h-3 w-3 inline mr-1" />
                              {app.personal_info?.phone}
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">
                              <Calendar className="h-3 w-3 inline mr-1" />
                              Applied: {new Date(app.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant={
                                app.status === 'approved' ? 'default' :
                                app.status === 'rejected' ? 'destructive' : 'secondary'
                              }
                            >
                              {app.status}
                            </Badge>
                            {app.status === 'pending' && (
                              <div className="flex gap-2 mt-3">
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateApplicationStatus(app.id, 'approved')}
                                  data-testid={`button-approve-${app.id}`}
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleUpdateApplicationStatus(app.id, 'rejected')}
                                  data-testid={`button-reject-${app.id}`}
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Select a Property</h3>
                <p className="text-muted-foreground">Click "Apps" on a property card to view its applications.</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="inquiries" className="space-y-4">
            <h2 className="text-xl font-semibold">Inquiries</h2>
            
            {inquiries.length === 0 ? (
              <Card className="p-8 text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No Inquiries Yet</h3>
                <p className="text-muted-foreground">You haven't received any inquiries for your properties.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {inquiries.map((inquiry) => (
                  <Card key={inquiry.id} className="p-4" data-testid={`card-inquiry-${inquiry.id}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{inquiry.sender_name}</h3>
                          <Badge
                            variant={inquiry.status === 'pending' ? 'secondary' : 'default'}
                            className="text-xs"
                          >
                            {inquiry.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          <Mail className="h-3 w-3 inline mr-1" />
                          {inquiry.sender_email}
                        </p>
                        {inquiry.sender_phone && (
                          <p className="text-sm text-muted-foreground mb-2">
                            <Phone className="h-3 w-3 inline mr-1" />
                            {inquiry.sender_phone}
                          </p>
                        )}
                        <p className="text-sm bg-muted/50 p-3 rounded-md mt-2">{inquiry.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(inquiry.created_at).toLocaleString()}
                        </p>
                      </div>
                      {inquiry.status === 'pending' && (
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateInquiryStatus(inquiry.id, 'responded')}
                            data-testid={`button-respond-${inquiry.id}`}
                          >
                            Mark Responded
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}
