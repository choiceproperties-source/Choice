import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';

export interface PropertyApplication {
  id: string;
  propertyId: string;
  userId: string;
  step: number;
  personalInfo?: Record<string, any>;
  rentalHistory?: Record<string, any>;
  employment?: Record<string, any>;
  references?: Record<string, any>;
  disclosures?: Record<string, any>;
  documents?: string[];
  status: 'pending' | 'approved' | 'rejected';
  applicationFee?: number;
  userEmail?: string;
  userName?: string;
  createdAt: string;
  updatedAt?: string;
}

export function usePropertyApplications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<PropertyApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch applications for owner's properties
  useEffect(() => {
    if (!user || user.role !== 'owner') {
      const localApps = JSON.parse(
        localStorage.getItem('choiceProperties_ownerApplications') || '[]'
      );
      setApplications(localApps);
      return;
    }

    const fetchApplications = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch applications for all owner's properties
        const response = await fetch(
          `/api/applications/property/${user.id}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch applications');
        }

        const data = await response.json();
        // Handle standardized response format
        const appList = data.data || data.applications || [];
        setApplications(appList);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error fetching applications';
        setError(message);
        // Fallback to localStorage
        const localApps = JSON.parse(
          localStorage.getItem('choiceProperties_ownerApplications') || '[]'
        );
        setApplications(localApps);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [user]);

  // Update application status
  const updateApplicationStatus = async (
    applicationId: string,
    status: 'pending' | 'approved' | 'rejected'
  ) => {
    if (!user) {
      const updated = applications.map((a) =>
        a.id === applicationId ? { ...a, status, updatedAt: new Date().toISOString() } : a
      );
      localStorage.setItem('choiceProperties_ownerApplications', JSON.stringify(updated));
      setApplications(updated);
      toast({
        title: 'Success',
        description: `Application ${status}`,
      });
      return updated.find((a) => a.id === applicationId) || null;
    }

    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update application');
      }

      const data = await response.json();
      const updatedApp = data.data || data;
      const updated = applications.map((a) =>
        a.id === applicationId ? updatedApp : a
      );
      setApplications(updated);
      toast({
        title: 'Success',
        description: `Application marked as ${status}`,
      });
      return updatedApp;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error updating application';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return null;
    }
  };

  return {
    applications,
    loading,
    error,
    updateApplicationStatus,
  };
}
