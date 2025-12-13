import { useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { useAuth } from '@/lib/auth-context';
import { useOwnerApplications } from '@/hooks/use-property-applications';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Loader2,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  User,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { updateMetaTags } from '@/lib/seo';

export default function LandlordApplications() {
  const { user, isLoggedIn } = useAuth();
  const [, navigate] = useLocation();
  const { applications, isLoading, updateStatus, isUpdatingStatus } = useOwnerApplications();

  useEffect(() => {
    updateMetaTags({
      title: 'Applications - Landlord Dashboard',
      description: 'Review and manage rental applications from tenants',
      image: 'https://choiceproperties.com/og-image.png',
      url: 'https://choiceproperties.com/landlord-applications',
    });
  }, []);

  // Redirect if not logged in or not a landlord
  if (!isLoggedIn || !user || (user.role !== 'landlord' && user.role !== 'admin')) {
    navigate('/login');
    return null;
  }

  // Group applications by status
  const groupedApplications = useMemo(() => {
    const groups: Record<string, any[]> = {
      pending: [],
      under_review: [],
      approved: [],
      rejected: [],
      other: [],
    };

    applications.forEach((app: any) => {
      if (app.status === 'pending') {
        groups.pending.push(app);
      } else if (app.status === 'under_review') {
        groups.under_review.push(app);
      } else if (app.status === 'approved') {
        groups.approved.push(app);
      } else if (app.status === 'rejected') {
        groups.rejected.push(app);
      } else {
        groups.other.push(app);
      }
    });

    return groups;
  }, [applications]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-50 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200',
      under_review: 'bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200',
      approved: 'bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200',
      rejected: 'bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200',
    };
    return colors[status] || 'bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
      case 'under_review':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getPaymentStatusBadge = (paymentStatus: string | null | undefined) => {
    switch (paymentStatus) {
      case 'paid':
        return (
          <Badge className="bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200" data-testid="badge-payment-paid">
            <DollarSign className="h-3 w-3 mr-1" />
            Fee Paid
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200" data-testid="badge-payment-failed">
            <DollarSign className="h-3 w-3 mr-1" />
            Payment Failed
          </Badge>
        );
      case 'pending':
      default:
        return (
          <Badge className="bg-orange-50 dark:bg-orange-950 text-orange-800 dark:text-orange-200" data-testid="badge-payment-pending">
            <DollarSign className="h-3 w-3 mr-1" />
            Awaiting Fee
          </Badge>
        );
    }
  };

  const ApplicationCard = ({ app }: { app: any }) => (
    <Card
      key={app.id}
      className="p-4 border-l-4"
      style={{
        borderLeftColor: app.status === 'approved' ? '#22c55e' : app.status === 'rejected' ? '#ef4444' : '#eab308',
      }}
      data-testid={`card-application-${app.id}`}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <h3 className="font-semibold text-foreground truncate">
              {app.users?.full_name || 'Unknown Applicant'}
            </h3>
          </div>
          {app.properties && (
            <p className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
              <FileText className="h-3 w-3" />
              {app.properties.title}
            </p>
          )}
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Mail className="h-3 w-3" />
            {app.users?.email}
          </p>
        </div>
        <Badge className={getStatusColor(app.status)}>
          <span className="flex items-center gap-1">
            {getStatusIcon(app.status)}
            {app.status.replace('_', ' ').charAt(0).toUpperCase() +
              app.status.replace('_', ' ').slice(1)}
          </span>
        </Badge>
      </div>

      <div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {new Date(app.created_at).toLocaleDateString()}
        </span>
        {app.status === 'pending' && (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() =>
                updateStatus({
                  applicationId: app.id,
                  status: 'under_review',
                })
              }
              disabled={isUpdatingStatus}
              data-testid={`button-review-${app.id}`}
            >
              {isUpdatingStatus ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Review'}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );

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
            <h1 className="text-4xl font-bold">Tenant Applications</h1>
            <p className="text-blue-100 mt-2">Review and manage tenant applications</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 flex-1">
        {isLoading ? (
          <Card className="p-12 text-center">
            <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
            <p className="text-foreground font-semibold">Loading applications...</p>
          </Card>
        ) : applications.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground font-semibold">No applications yet</p>
            <p className="text-muted-foreground text-sm mt-2">
              Applications from tenants will appear here
            </p>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Pending Applications */}
            {groupedApplications.pending.length > 0 && (
              <div data-testid="section-pending">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Clock className="h-6 w-6 text-yellow-600" />
                  Pending Applications ({groupedApplications.pending.length})
                </h2>
                <div className="space-y-4">
                  {groupedApplications.pending.map((app) => (
                    <ApplicationCard key={app.id} app={app} />
                  ))}
                </div>
              </div>
            )}

            {/* Under Review */}
            {groupedApplications.under_review.length > 0 && (
              <div data-testid="section-under-review">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-6 w-6 text-blue-600" />
                  Under Review ({groupedApplications.under_review.length})
                </h2>
                <div className="space-y-4">
                  {groupedApplications.under_review.map((app) => (
                    <ApplicationCard key={app.id} app={app} />
                  ))}
                </div>
              </div>
            )}

            {/* Approved */}
            {groupedApplications.approved.length > 0 && (
              <div data-testid="section-approved">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  Approved ({groupedApplications.approved.length})
                </h2>
                <div className="space-y-4">
                  {groupedApplications.approved.map((app) => (
                    <ApplicationCard key={app.id} app={app} />
                  ))}
                </div>
              </div>
            )}

            {/* Rejected */}
            {groupedApplications.rejected.length > 0 && (
              <div data-testid="section-rejected">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <XCircle className="h-6 w-6 text-red-600" />
                  Rejected ({groupedApplications.rejected.length})
                </h2>
                <div className="space-y-4">
                  {groupedApplications.rejected.map((app) => (
                    <ApplicationCard key={app.id} app={app} />
                  ))}
                </div>
              </div>
            )}

            {/* Other Statuses */}
            {groupedApplications.other.length > 0 && (
              <div data-testid="section-other">
                <h2 className="text-2xl font-bold text-foreground mb-4">Other</h2>
                <div className="space-y-4">
                  {groupedApplications.other.map((app) => (
                    <ApplicationCard key={app.id} app={app} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
