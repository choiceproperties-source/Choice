import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { useAuth } from '@/lib/auth-context';
import { useInquiries } from '@/hooks/use-inquiries';
import { useRequirements } from '@/hooks/use-requirements';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  MessageSquare,
  FileText,
  Users,
  LogOut,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  Mail,
  Phone,
  Loader2,
  Briefcase,
  MapPin,
  DollarSign,
  Edit2,
} from 'lucide-react';

export default function AgentDashboard() {
  const { user, logout, isLoggedIn } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('inquiries');
  const [showNewRequirementForm, setShowNewRequirementForm] = useState(false);
  const [newRequirement, setNewRequirement] = useState({
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    budgetMin: 0,
    budgetMax: 0,
    bedrooms: 0,
    bathrooms: 0,
    locations: '',
    amenities: '',
    leaseTerm: '',
    moveInDate: '',
    additionalNotes: '',
  });

  // Fetch hooks
  const {
    agentInquiries,
    isLoading: inquiriesLoading,
  } = useInquiries();
  const {
    requirements,
    loading: reqsLoading,
    createRequirement,
    deleteRequirement,
    updateRequirement,
  } = useRequirements();

  // Redirect if not logged in or not an agent
  if (!isLoggedIn || !user) {
    navigate('/login');
    return null;
  }

  if (user.role !== 'agent' && user.role !== 'admin') {
    navigate('/');
    return null;
  }

  // Calculate stats
  const stats = useMemo(() => ({
    inquiries: agentInquiries.length,
    requirements: requirements.length,
    leads: agentInquiries.length + requirements.length,
    pendingInquiries: agentInquiries.filter((i: any) => i.status === 'pending').length,
  }), [agentInquiries, requirements]);

  // Handle add requirement
  const handleAddRequirement = async () => {
    if (!newRequirement.contactName || !newRequirement.contactEmail) {
      toast({
        title: 'Error',
        description: 'Please fill in contact name and email',
        variant: 'destructive',
      });
      return;
    }

    const result = await createRequirement({
      contactName: newRequirement.contactName,
      contactEmail: newRequirement.contactEmail,
      contactPhone: newRequirement.contactPhone,
      budgetMin: newRequirement.budgetMin,
      budgetMax: newRequirement.budgetMax,
      bedrooms: newRequirement.bedrooms,
      bathrooms: newRequirement.bathrooms,
      locations: newRequirement.locations ? newRequirement.locations.split(',').map(l => l.trim()) : [],
      amenities: newRequirement.amenities ? newRequirement.amenities.split(',').map(a => a.trim()) : [],
      leaseTerm: newRequirement.leaseTerm,
      moveInDate: newRequirement.moveInDate,
      additionalNotes: newRequirement.additionalNotes,
    });

    if (result) {
      setNewRequirement({
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        budgetMin: 0,
        budgetMax: 0,
        bedrooms: 0,
        bathrooms: 0,
        locations: '',
        amenities: '',
        leaseTerm: '',
        moveInDate: '',
        additionalNotes: '',
      });
      setShowNewRequirementForm(false);
    }
  };

  // Handle delete requirement
  const handleDeleteRequirement = async (requirementId: string) => {
    if (confirm('Are you sure you want to delete this requirement?')) {
      await deleteRequirement(requirementId);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-50 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800',
      responded: 'bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800',
      closed: 'bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-800',
    };
    return colors[status] || colors.pending;
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
      responded: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      closed: 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200',
    };
    return styles[status] || styles.pending;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-12">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">Agent Dashboard</h1>
            <p className="text-white/80 mt-2">Manage inquiries, requirements, and leads</p>
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
          <Card className="p-4" data-testid="stat-inquiries">
            <p className="text-sm font-semibold text-muted-foreground">Inquiries</p>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.inquiries}</p>
            <p className="text-xs text-muted-foreground mt-1">{stats.pendingInquiries} pending</p>
          </Card>
          <Card className="p-4" data-testid="stat-requirements">
            <p className="text-sm font-semibold text-muted-foreground">Requirements</p>
            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {stats.requirements}
            </p>
            <Users className="h-4 w-4 text-indigo-500 mt-2" />
          </Card>
          <Card className="p-4" data-testid="stat-leads">
            <p className="text-sm font-semibold text-muted-foreground">Total Leads</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.leads}</p>
            <Briefcase className="h-4 w-4 text-blue-500 mt-2" />
          </Card>
          <Card className="p-4" data-testid="stat-conversion">
            <p className="text-sm font-semibold text-muted-foreground">Conversion Rate</p>
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.leads > 0 ? Math.round((stats.requirements / stats.leads) * 100) : 0}%
            </p>
            <CheckCircle className="h-4 w-4 text-emerald-500 mt-2" />
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 mt-12 flex-1">
        <div className="flex gap-2 mb-8 flex-wrap border-b border-border">
          {[
            { id: 'inquiries', label: 'Inquiries', icon: MessageSquare },
            { id: 'requirements', label: 'Requirements', icon: FileText },
            { id: 'leads', label: 'Lead Management', icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-semibold transition-all border-b-2 flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-b-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-b-transparent text-muted-foreground hover:text-foreground'
              }`}
              data-testid={`tab-${tab.id}`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Inquiries */}
        {activeTab === 'inquiries' && (
          <div className="space-y-4 pb-12" data-testid="section-inquiries">
            {inquiriesLoading ? (
              <Card className="p-12 text-center">
                <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
                <p className="text-foreground font-semibold">Loading inquiries...</p>
              </Card>
            ) : agentInquiries.length === 0 ? (
              <Card className="p-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-foreground font-semibold">No inquiries yet</p>
                <p className="text-muted-foreground text-sm mt-2">Visitor inquiries will appear here</p>
              </Card>
            ) : (
              agentInquiries.map((inquiry: any) => (
                <Card
                  key={inquiry.id}
                  className={`p-6 border-l-4 ${getStatusColor(inquiry.status)}`}
                  data-testid={`card-inquiry-${inquiry.id}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-foreground">{inquiry.senderName}</h3>
                      <div className="flex flex-col gap-1 mt-2 text-sm text-muted-foreground">
                        <p className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {inquiry.senderEmail}
                        </p>
                        {inquiry.senderPhone && (
                          <p className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {inquiry.senderPhone}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge
                      className={getStatusBadge(inquiry.status)}
                      data-testid={`badge-status-${inquiry.status}`}
                    >
                      {inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1)}
                    </Badge>
                  </div>

                  {inquiry.message && (
                    <div className="bg-muted p-4 rounded mb-4">
                      <p className="text-foreground text-sm">{inquiry.message}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Inquiry Type</p>
                      <p className="font-semibold text-foreground">{inquiry.inquiryType || 'General'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Submitted</p>
                      <p className="font-semibold text-foreground">
                        {new Date(inquiry.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Requirements */}
        {activeTab === 'requirements' && (
          <div className="space-y-4 pb-12" data-testid="section-requirements">
            {!showNewRequirementForm ? (
              <Button
                onClick={() => setShowNewRequirementForm(true)}
                className="bg-purple-600 hover:bg-purple-700"
                data-testid="button-add-requirement"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Requirement
              </Button>
            ) : (
              <Card className="p-6 border-l-4 border-purple-500">
                <h3 className="font-bold text-lg mb-4 text-foreground">Add New Client Requirement</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="Client Name"
                      value={newRequirement.contactName}
                      onChange={(e) =>
                        setNewRequirement({ ...newRequirement, contactName: e.target.value })
                      }
                      data-testid="input-client-name"
                    />
                    <Input
                      placeholder="Email"
                      type="email"
                      value={newRequirement.contactEmail}
                      onChange={(e) =>
                        setNewRequirement({ ...newRequirement, contactEmail: e.target.value })
                      }
                      data-testid="input-client-email"
                    />
                  </div>
                  <Input
                    placeholder="Phone"
                    value={newRequirement.contactPhone}
                    onChange={(e) =>
                      setNewRequirement({ ...newRequirement, contactPhone: e.target.value })
                    }
                    data-testid="input-client-phone"
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <Input
                      type="number"
                      placeholder="Min Budget"
                      value={newRequirement.budgetMin}
                      onChange={(e) =>
                        setNewRequirement({ ...newRequirement, budgetMin: Number(e.target.value) })
                      }
                      data-testid="input-budget-min"
                    />
                    <Input
                      type="number"
                      placeholder="Max Budget"
                      value={newRequirement.budgetMax}
                      onChange={(e) =>
                        setNewRequirement({ ...newRequirement, budgetMax: Number(e.target.value) })
                      }
                      data-testid="input-budget-max"
                    />
                    <Input
                      type="number"
                      placeholder="Bedrooms"
                      value={newRequirement.bedrooms}
                      onChange={(e) =>
                        setNewRequirement({ ...newRequirement, bedrooms: Number(e.target.value) })
                      }
                      data-testid="input-bedrooms"
                    />
                  </div>
                  <Input
                    type="number"
                    placeholder="Bathrooms"
                    value={newRequirement.bathrooms}
                    onChange={(e) =>
                      setNewRequirement({ ...newRequirement, bathrooms: Number(e.target.value) })
                    }
                    data-testid="input-bathrooms"
                  />
                  <Input
                    placeholder="Preferred Locations (comma-separated)"
                    value={newRequirement.locations}
                    onChange={(e) =>
                      setNewRequirement({ ...newRequirement, locations: e.target.value })
                    }
                    data-testid="input-locations"
                  />
                  <Input
                    placeholder="Desired Amenities (comma-separated)"
                    value={newRequirement.amenities}
                    onChange={(e) =>
                      setNewRequirement({ ...newRequirement, amenities: e.target.value })
                    }
                    data-testid="input-amenities"
                  />
                  <Input
                    placeholder="Lease Term"
                    value={newRequirement.leaseTerm}
                    onChange={(e) =>
                      setNewRequirement({ ...newRequirement, leaseTerm: e.target.value })
                    }
                    data-testid="input-lease-term"
                  />
                  <Input
                    type="date"
                    value={newRequirement.moveInDate}
                    onChange={(e) =>
                      setNewRequirement({ ...newRequirement, moveInDate: e.target.value })
                    }
                    data-testid="input-move-in-date"
                  />
                  <Textarea
                    placeholder="Additional Notes"
                    value={newRequirement.additionalNotes}
                    onChange={(e) =>
                      setNewRequirement({ ...newRequirement, additionalNotes: e.target.value })
                    }
                    data-testid="textarea-notes"
                  />
                  <div className="flex gap-3">
                    <Button
                      onClick={handleAddRequirement}
                      className="bg-purple-600 hover:bg-purple-700"
                      data-testid="button-save-requirement"
                    >
                      Save Requirement
                    </Button>
                    <Button
                      onClick={() => setShowNewRequirementForm(false)}
                      variant="outline"
                      data-testid="button-cancel-requirement"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {reqsLoading ? (
              <Card className="p-12 text-center">
                <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
                <p className="text-foreground font-semibold">Loading requirements...</p>
              </Card>
            ) : requirements.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-foreground font-semibold">No requirements yet</p>
                <p className="text-muted-foreground text-sm mt-2">Add client requirements to match with properties</p>
              </Card>
            ) : (
              requirements.map((req) => (
                <Card key={req.id} className="p-6" data-testid={`card-requirement-${req.id}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-foreground">{req.contactName}</h3>
                      <div className="flex flex-col gap-1 mt-2 text-sm text-muted-foreground">
                        <p className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {req.contactEmail}
                        </p>
                        {req.contactPhone && (
                          <p className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {req.contactPhone}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteRequirement(req.id)}
                      data-testid={`button-delete-requirement-${req.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {req.budgetMin && req.budgetMax && (
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          Budget
                        </p>
                        <p className="font-semibold text-foreground">
                          ${(req.budgetMin || 0).toLocaleString()} - ${(req.budgetMax || 0).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {req.bedrooms && (
                      <div>
                        <p className="text-xs text-muted-foreground">Bedrooms</p>
                        <p className="font-semibold text-foreground">{req.bedrooms}+</p>
                      </div>
                    )}
                    {req.bathrooms && (
                      <div>
                        <p className="text-xs text-muted-foreground">Bathrooms</p>
                        <p className="font-semibold text-foreground">{req.bathrooms}+</p>
                      </div>
                    )}
                    {req.moveInDate && (
                      <div>
                        <p className="text-xs text-muted-foreground">Move-In</p>
                        <p className="font-semibold text-foreground">
                          {new Date(req.moveInDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {req.locations && req.locations.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground mb-2">Preferred Locations</p>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(req.locations) ? req.locations : [req.locations]).map(
                          (loc: string, idx: number) => (
                            <Badge key={idx} variant="outline">
                              <MapPin className="h-3 w-3 mr-1" />
                              {loc}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {req.additionalNotes && (
                    <div className="bg-muted p-3 rounded text-sm text-muted-foreground">
                      <strong className="text-foreground">Notes:</strong> {req.additionalNotes}
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        )}

        {/* Lead Management */}
        {activeTab === 'leads' && (
          <div className="space-y-4 pb-12" data-testid="section-leads">
            <Card className="p-6">
              <h3 className="font-bold text-lg text-foreground mb-4">Lead Overview</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded">
                    <p className="text-xs text-muted-foreground">Total Inquiries</p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {stats.inquiries}
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded">
                    <p className="text-xs text-muted-foreground">Client Requirements</p>
                    <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                      {stats.requirements}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  You have {stats.pendingInquiries} pending inquiries and {stats.requirements} active client requirements.
                  Continue building your leads by responding to inquiries and managing client expectations.
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold text-lg text-foreground mb-4">Lead Management Tips</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Respond to inquiries within 24 hours for better conversion</li>
                <li>✓ Match client requirements with available properties</li>
                <li>✓ Follow up with clients regularly to maintain engagement</li>
                <li>✓ Track client preferences to provide personalized recommendations</li>
              </ul>
            </Card>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
