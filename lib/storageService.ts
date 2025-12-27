/**
 * Supabase Storage Service for Employee Photos
 */

import { supabase, isSupabaseConfigured } from './supabase';

const BUCKET_NAME = 'photos';

/**
 * Get the public URL for a photo in Supabase Storage
 */
export const getPhotoUrl = (filename: string): string => {
  if (!filename) return '';

  // If already a full URL, return as-is
  if (filename.startsWith('http') || filename.startsWith('data:')) {
    return filename;
  }

  // Build Supabase Storage public URL
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    // Fallback to local path if Supabase not configured
    return `/photos/${filename}`;
  }

  return `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${filename}`;
};

/**
 * Upload a photo to Supabase Storage
 */
export const uploadPhoto = async (
  file: File,
  filename?: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const finalFilename = filename || file.name;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(finalFilename, file, {
        cacheControl: '3600',
        upsert: true // Overwrite if exists
      });

    if (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }

    const url = getPhotoUrl(finalFilename);
    return { success: true, url };
  } catch (err: any) {
    console.error('Upload failed:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Upload a base64 image to Supabase Storage
 */
export const uploadBase64Photo = async (
  base64Data: string,
  filename: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    // Remove data URL prefix if present
    const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');

    // Convert base64 to blob
    const byteCharacters = atob(base64Content);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    // Detect content type
    const contentType = base64Data.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';
    const blob = new Blob([byteArray], { type: contentType });

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, blob, {
        contentType,
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }

    const url = getPhotoUrl(filename);
    return { success: true, url };
  } catch (err: any) {
    console.error('Upload failed:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Delete a photo from Supabase Storage
 */
export const deletePhoto = async (filename: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filename]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Delete failed:', err);
    return false;
  }
};

/**
 * List all photos in the bucket
 */
export const listPhotos = async (): Promise<string[]> => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      console.error('List error:', error);
      return [];
    }

    return data.map(file => file.name);
  } catch (err) {
    console.error('List failed:', err);
    return [];
  }
};

/**
 * Check if a photo exists in storage
 */
export const photoExists = async (filename: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', {
        search: filename
      });

    if (error) {
      return false;
    }

    return data.some(file => file.name === filename);
  } catch (err) {
    return false;
  }
};
