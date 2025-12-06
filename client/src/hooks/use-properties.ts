import { useQuery } from '@tanstack/react-query';
import type { Property } from '@/lib/types';

export function useProperties() {
  const { data: properties = [], isLoading: loading, error } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
  });

  if (error) {
    console.error('Error fetching properties:', error);
  }

  return { properties, loading };
}
