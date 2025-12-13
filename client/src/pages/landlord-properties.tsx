import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { useAuth } from '@/lib/auth-context';
import { useOwnedProperties } from '@/hooks/use-owned-properties';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Home,
  Plus,
  Trash2,
  MapPin,
  DollarSign,
  Bed,
  Bath,
  Loader2,
  ArrowLeft,
  Edit2,
} from 'lucide-react';
import { updateMetaTags } from '@/lib/seo';

export default function LandlordProperties() {
  const { user, isLoggedIn } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showNewPropertyForm, setShowNewPropertyForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { properties, loading, createProperty, updateProperty, deleteProperty } =
    useOwnedProperties();

  const [formData, setFormData] = useState({
    title: '',
    address: '',
    city: '',
    state: '',
    price: 0,
    bedrooms: 1,
    bathrooms: 1,
    description: '',
  });

  useEffect(() => {
    updateMetaTags({
      title: 'My Properties - Landlord Dashboard',
      description: 'Manage and edit your rental properties',
      image: 'https://choiceproperties.com/og-image.png',
      url: 'https://choiceproperties.com/landlord-properties',
    });
  }, []);

  // Redirect if not logged in or not a landlord
  if (!isLoggedIn || !user || (user.role !== 'landlord' && user.role !== 'admin')) {
    navigate('/login');
    return null;
  }

  const resetForm = () => {
    setFormData({
      title: '',
      address: '',
      city: '',
      state: '',
      price: 0,
      bedrooms: 1,
      bathrooms: 1,
      description: '',
    });
    setEditingId(null);
  };

  const handleSaveProperty = async () => {
    if (!formData.title || !formData.address) {
      toast({
        title: 'Error',
        description: 'Please fill in title and address',
        variant: 'destructive',
      });
      return;
    }

    if (editingId) {
      await updateProperty(editingId, formData);
    } else {
      await createProperty(formData);
    }

    resetForm();
    setShowNewPropertyForm(false);
  };

  const handleEditProperty = (property: any) => {
    setFormData({
      title: property.title,
      address: property.address,
      city: property.city || '',
      state: property.state || '',
      price: property.price || 0,
      bedrooms: property.bedrooms || 1,
      bathrooms: property.bathrooms || 1,
      description: property.description || '',
    });
    setEditingId(property.id);
    setShowNewPropertyForm(true);
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (confirm('Are you sure you want to delete this property?')) {
      await deleteProperty(propertyId);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-12">
        <div className="container mx-auto px-4 flex items-center gap-4">
          <Button
            onClick={() => navigate('/landlord-dashboard')}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold">My Properties</h1>
            <p className="text-blue-100 mt-2">Create, edit, and manage your rental properties</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 flex-1">
        {/* Add/Edit Form */}
        {!showNewPropertyForm ? (
          <Button
            onClick={() => {
              resetForm();
              setShowNewPropertyForm(true);
            }}
            className="mb-8 bg-blue-600 hover:bg-blue-700"
            data-testid="button-add-property"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Property
          </Button>
        ) : (
          <Card className="p-8 mb-8 border-l-4 border-blue-500">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              {editingId ? 'Edit Property' : 'Add New Property'}
            </h2>
            <div className="space-y-4">
              <Input
                placeholder="Property Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                data-testid="input-property-title"
              />
              <Input
                placeholder="Street Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                data-testid="input-property-address"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  data-testid="input-property-city"
                />
                <Input
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  data-testid="input-property-state"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input
                  type="number"
                  placeholder="Monthly Price"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  data-testid="input-property-price"
                />
                <Input
                  type="number"
                  placeholder="Bedrooms"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData({ ...formData, bedrooms: Number(e.target.value) })}
                  data-testid="input-property-bedrooms"
                />
                <Input
                  type="number"
                  placeholder="Bathrooms"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData({ ...formData, bathrooms: Number(e.target.value) })}
                  data-testid="input-property-bathrooms"
                />
              </div>
              <Textarea
                placeholder="Property Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                data-testid="textarea-property-description"
                rows={4}
              />
              <div className="flex gap-3">
                <Button
                  onClick={handleSaveProperty}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="button-save-property"
                >
                  {editingId ? 'Update' : 'Save'} Property
                </Button>
                <Button
                  onClick={() => {
                    resetForm();
                    setShowNewPropertyForm(false);
                  }}
                  variant="outline"
                  data-testid="button-cancel-property"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Properties List */}
        {loading ? (
          <Card className="p-12 text-center">
            <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
            <p className="text-foreground font-semibold">Loading properties...</p>
          </Card>
        ) : properties.length === 0 ? (
          <Card className="p-12 text-center">
            <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground font-semibold">No properties yet</p>
            <p className="text-muted-foreground text-sm mt-2">
              Add your first property to start renting
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property: any) => (
              <Card
                key={property.id}
                className="overflow-hidden hover-elevate"
                data-testid={`card-property-${property.id}`}
              >
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <Home className="h-12 w-12 text-muted-foreground" />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg text-foreground mb-2">{property.title}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
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
                  <p className="font-bold text-blue-600 dark:text-blue-400 text-lg mb-4 flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {(property.price || 0).toLocaleString()}/mo
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEditProperty(property)}
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      data-testid={`button-edit-property-${property.id}`}
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDeleteProperty(property.id)}
                      size="sm"
                      variant="destructive"
                      data-testid={`button-delete-property-${property.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
