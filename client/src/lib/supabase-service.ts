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

// ===================== USERS =====================
export async function getCurrentUserProfile() {
  if (!supabase) return null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    if (error) throw error;
    return data || null;
  } catch (err) {
    console.error('Error fetching user profile:', err);
    return null;
  }
}

export async function updateUserProfile(userId: string, updates: any) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data || null;
  } catch (err) {
    console.error('Error updating user profile:', err);
    return null;
  }
}

export async function getAllUsers() {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching users:', err);
    return [];
  }
}

export async function updateUserRole(userId: string, role: string) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data || null;
  } catch (err) {
    console.error('Error updating user role:', err);
    return null;
  }
}

// ===================== FILE UPLOADS =====================
export async function uploadPropertyImage(file: File, propertyId: string): Promise<string | null> {
  if (!supabase) return null;
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${propertyId}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('property-images')
      .upload(fileName, file);
    
    if (uploadError) throw uploadError;
    
    const { data } = supabase.storage
      .from('property-images')
      .getPublicUrl(fileName);
    
    return data.publicUrl;
  } catch (err) {
    console.error('Error uploading property image:', err);
    return null;
  }
}

export async function uploadProfileImage(file: File, userId: string): Promise<string | null> {
  if (!supabase) return null;
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/profile.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('profile-images')
      .upload(fileName, file, { upsert: true });
    
    if (uploadError) throw uploadError;
    
    const { data } = supabase.storage
      .from('profile-images')
      .getPublicUrl(fileName);
    
    return data.publicUrl;
  } catch (err) {
    console.error('Error uploading profile image:', err);
    return null;
  }
}

export async function uploadDocument(file: File, userId: string, applicationId: string): Promise<string | null> {
  if (!supabase) return null;
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${applicationId}/${Date.now()}_${file.name}`;
    
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file);
    
    if (uploadError) throw uploadError;
    
    return fileName;
  } catch (err) {
    console.error('Error uploading document:', err);
    return null;
  }
}

export async function getDocumentUrl(filePath: string): Promise<string | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 3600);
    
    if (error) throw error;
    return data.signedUrl;
  } catch (err) {
    console.error('Error getting document URL:', err);
    return null;
  }
}

export async function deletePropertyImages(propertyId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data: files } = await supabase.storage
      .from('property-images')
      .list(propertyId);
    
    if (files && files.length > 0) {
      const filePaths = files.map(f => `${propertyId}/${f.name}`);
      await supabase.storage.from('property-images').remove(filePaths);
    }
    
    return true;
  } catch (err) {
    console.error('Error deleting property images:', err);
    return false;
  }
}

// ===================== REQUIREMENTS =====================
export async function createRequirement(requirement: any) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('requirements')
      .insert([requirement])
      .select()
      .single();
    if (error) throw error;
    return data || null;
  } catch (err) {
    console.error('Error creating requirement:', err);
    return null;
  }
}

export async function getRequirements(userId?: string) {
  if (!supabase) return [];
  try {
    let query = supabase.from('requirements').select('*');
    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching requirements:', err);
    return [];
  }
}

// ===================== AGENT DASHBOARD =====================
export async function getAgentProperties(agentId: string) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('owner_id', agentId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching agent properties:', err);
    return [];
  }
}

export async function getApplicationsForProperty(propertyId: string) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching applications:', err);
    return [];
  }
}

export async function getAgentInquiries(agentId: string) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('inquiries')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching inquiries:', err);
    return [];
  }
}

export async function updateInquiryStatus(inquiryId: string, status: string) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('inquiries')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', inquiryId)
      .select()
      .single();
    if (error) throw error;
    return data || null;
  } catch (err) {
    console.error('Error updating inquiry status:', err);
    return null;
  }
}

// ===================== ADMIN DASHBOARD =====================
export async function getAdminStats() {
  if (!supabase) return null;
  try {
    const [properties, users, applications, reviews, inquiries] = await Promise.all([
      supabase.from('properties').select('id, property_type, status, price', { count: 'exact' }),
      supabase.from('users').select('id, role', { count: 'exact' }),
      supabase.from('applications').select('id, status', { count: 'exact' }),
      supabase.from('reviews').select('id, rating', { count: 'exact' }),
      supabase.from('inquiries').select('id, status', { count: 'exact' })
    ]);
    
    return {
      totalProperties: properties.count || 0,
      totalUsers: users.count || 0,
      totalApplications: applications.count || 0,
      totalReviews: reviews.count || 0,
      totalInquiries: inquiries.count || 0,
      properties: properties.data || [],
      users: users.data || [],
      applications: applications.data || [],
      reviews: reviews.data || [],
      inquiries: inquiries.data || []
    };
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    return null;
  }
}

export async function getAllReviews() {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, users(full_name, email), properties(title)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching all reviews:', err);
    return [];
  }
}

export async function deleteReview(reviewId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error deleting review:', err);
    return false;
  }
}

// ===================== ADMIN USER MANAGEMENT =====================
export async function createUser(userData: { email: string; full_name: string; role: string }) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([{ 
        id: `user_${Date.now()}`,
        ...userData, 
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    if (error) throw error;
    return data || null;
  } catch (err) {
    console.error('Error creating user:', err);
    return null;
  }
}

export async function deleteUser(userId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error deleting user:', err);
    return false;
  }
}

// ===================== SAVED SEARCHES =====================
export async function getSavedSearches() {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('saved_searches')
      .select('*, users(full_name, email)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching saved searches:', err);
    return [];
  }
}

export async function deleteSavedSearch(searchId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('saved_searches')
      .delete()
      .eq('id', searchId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error deleting saved search:', err);
    return false;
  }
}
