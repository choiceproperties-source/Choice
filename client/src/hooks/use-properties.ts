import { useState, useEffect } from 'react';
import { getProperties } from '@/lib/supabase-service';
import propertiesData from '@/data/properties.json';
import type { Property } from '@/lib/types';

export function useProperties() {
  const [properties, setProperties] = useState<Property[]>(propertiesData as Property[]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const supabaseProps = await getProperties();
        if (supabaseProps.length > 0) {
          setProperties(supabaseProps);
        }
      } catch (err) {
        console.error('Error fetching properties:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  return { properties, loading };
}
