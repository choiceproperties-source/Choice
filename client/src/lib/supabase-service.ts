import { supabase } from './supabase';
import type { Property, Review } from './types';

// ===================== PROPERTIES =====================
export async function getProperties(): Promise<Property[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*');
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching properties:', err);
    return [];
  }
}

export async function getPropertyById(id: string): Promise<Property | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data || null;
  } catch (err) {
    console.error('Error fetching property:', err);
    return null;
  }
}

export async function createProperty(property: Omit<Property, 'id'>): Promise<Property | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('properties')
      .insert([property])
      .select()
      .single();
    if (error) throw error;
    return data || null;
  } catch (err) {
    console.error('Error creating property:', err);
    return null;
  }
}

export async function updateProperty(id: string, updates: Partial<Property>): Promise<Property | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data || null;
  } catch (err) {
    console.error('Error updating property:', err);
    return null;
  }
}

export async function deleteProperty(id: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error deleting property:', err);
    return false;
  }
}

// ===================== APPLICATIONS =====================
export async function getApplications(userId?: string) {
  if (!supabase) return [];
  try {
    let query = supabase.from('applications').select('*');
    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching applications:', err);
    return [];
  }
}

export async function createApplication(application: any) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('applications')
      .insert([application])
      .select()
      .single();
    if (error) throw error;
    return data || null;
  } catch (err) {
    console.error('Error creating application:', err);
    return null;
  }
}

export async function updateApplication(id: string, updates: any) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('applications')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data || null;
  } catch (err) {
    console.error('Error updating application:', err);
    return null;
  }
}

// ===================== REVIEWS =====================
export async function getReviews(propertyId: string): Promise<Review[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('property_id', propertyId);
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching reviews:', err);
    return [];
  }
}

export async function createReview(review: Omit<Review, 'id'>) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('reviews')
      .insert([{ id: `review_${Date.now()}`, ...review }])
      .select()
      .single();
    if (error) throw error;
    return data || null;
  } catch (err) {
    console.error('Error creating review:', err);
    return null;
  }
}

// ===================== FAVORITES =====================
export async function getFavorites(userId: string) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('property_id')
      .eq('user_id', userId);
    if (error) throw error;
    return data?.map(f => f.property_id) || [];
  } catch (err) {
    console.error('Error fetching favorites:', err);
    return [];
  }
}

export async function addFavorite(userId: string, propertyId: string) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('favorites')
      .insert([{ id: `fav_${userId}_${propertyId}`, user_id: userId, property_id: propertyId }]);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error adding favorite:', err);
    return false;
  }
}

export async function removeFavorite(userId: string, propertyId: string) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('property_id', propertyId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error removing favorite:', err);
    return false;
  }
}

// ===================== INQUIRIES =====================
export async function createInquiry(inquiry: any) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('inquiries')
      .insert([{ id: `inquiry_${Date.now()}`, ...inquiry }])
      .select()
      .single();
    if (error) throw error;
    return data || null;
  } catch (err) {
    console.error('Error creating inquiry:', err);
    return null;
  }
}

export async function getInquiries() {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('inquiries')
      .select('*');
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching inquiries:', err);
    return [];
  }
}

// ===================== MIGRATION UTILITIES =====================
export async function migrateDataToSupabase() {
  if (!supabase) {
    console.warn('Supabase not configured - skipping migration');
    return;
  }

  try {
    // Migrate properties from localStorage
    const localProperties = JSON.parse(localStorage.getItem('choiceProperties_listings') || '[]');
    if (localProperties.length > 0) {
      await supabase.from('properties').insert(localProperties);
      console.log('Migrated properties to Supabase');
    }

    // Migrate applications
    const localApplications = JSON.parse(localStorage.getItem('choiceProperties_applications') || '[]');
    if (localApplications.length > 0) {
      await supabase.from('applications').insert(localApplications);
      console.log('Migrated applications to Supabase');
    }

    console.log('Data migration complete');
  } catch (err) {
    console.error('Error during migration:', err);
  }
}
