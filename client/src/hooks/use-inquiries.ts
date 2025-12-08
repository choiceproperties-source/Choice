import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth-context';
import type { Inquiry } from '@/lib/types';

export function useInquiries() {
  const { user } = useAuth();

  // Fetch agent's inquiries
  const { data: agentInquiries = [], isLoading } = useQuery<Inquiry[]>({
    queryKey: ['/api/inquiries/agent', user?.id],
    enabled: !!user?.id && user?.role === 'agent',
  });

  // Submit inquiry mutation
  const submitInquiryMutation = useMutation({
    mutationFn: async (inquiryData: Record<string, any>) => {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inquiryData),
      });
      if (!response.ok) throw new Error('Failed to submit inquiry');
      return response.json();
    },
    onSuccess: () => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['/api/inquiries/agent', user.id] });
      }
    },
  });

  return {
    agentInquiries,
    submitInquiry: submitInquiryMutation.mutate,
    submitInquiryAsync: submitInquiryMutation.mutateAsync,
    isSubmitting: submitInquiryMutation.isPending,
    isLoading,
    error: submitInquiryMutation.error,
  };
}
