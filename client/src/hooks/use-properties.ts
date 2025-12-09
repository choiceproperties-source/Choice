import { useQuery } from '@tanstack/react-query';
import type { Property } from '@/lib/types';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface PropertiesApiResponse {
  success: boolean;
  data: {
    properties: Property[];
    pagination: PaginationInfo;
  };
  message?: string;
}

export function useProperties() {
  const { data, isLoading: loading, error } = useQuery<PropertiesApiResponse>({
    queryKey: ['/api/properties'],
    staleTime: 0,
    refetchOnMount: true,
  });

  if (error) {
  }

  const properties = data?.data?.properties || [];

  return { properties, loading };
}

export function useAllProperties() {
  return useProperties();
}
