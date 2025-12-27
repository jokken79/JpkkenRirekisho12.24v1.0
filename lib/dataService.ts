// Data Service - Abstraction layer for Supabase
// Replaces direct Dexie calls with Supabase operations

import { supabase, isSupabaseConfigured } from './supabase';
import type { Staff, StaffInsert, Resume, ResumeInsert, Application, ApplicationInsert, Factory, FactoryInsert, UserProfile } from './database.types';

// ============ STAFF OPERATIONS ============

export const staffService = {
  async getAll(type?: 'GenzaiX' | 'Ukeoi'): Promise<Staff[]> {
    let query = supabase.from('staff').select('*');
    if (type) {
      query = query.eq('type', type);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Staff | null> {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async create(staff: StaffInsert): Promise<Staff> {
    const { data, error } = await supabase
      .from('staff')
      .insert(staff)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<StaffInsert>): Promise<Staff> {
    const { data, error } = await supabase
      .from('staff')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('staff').delete().eq('id', id);
    if (error) throw error;
  },

  async search(term: string, type?: 'GenzaiX' | 'Ukeoi'): Promise<Staff[]> {
    let query = supabase
      .from('staff')
      .select('*')
      .or(`full_name.ilike.%${term}%,emp_id.ilike.%${term}%,phone.ilike.%${term}%`);

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async count(type?: 'GenzaiX' | 'Ukeoi'): Promise<number> {
    let query = supabase.from('staff').select('*', { count: 'exact', head: true });
    if (type) {
      query = query.eq('type', type);
    }
    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  }
};

// ============ RESUME OPERATIONS ============

export const resumeService = {
  async getAll(): Promise<Resume[]> {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Resume | null> {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async create(resume: ResumeInsert): Promise<Resume> {
    const { data, error } = await supabase
      .from('resumes')
      .insert(resume)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<ResumeInsert>): Promise<Resume> {
    const { data, error } = await supabase
      .from('resumes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('resumes').delete().eq('id', id);
    if (error) throw error;
  },

  async search(term: string): Promise<Resume[]> {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .or(`full_name.ilike.%${term}%,applicant_id.ilike.%${term}%,phone.ilike.%${term}%`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async count(): Promise<number> {
    const { count, error } = await supabase
      .from('resumes')
      .select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count || 0;
  }
};

// ============ APPLICATION OPERATIONS ============

export const applicationService = {
  async getAll(): Promise<Application[]> {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Application | null> {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async create(application: ApplicationInsert): Promise<Application> {
    const { data, error } = await supabase
      .from('applications')
      .insert(application)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<ApplicationInsert>): Promise<Application> {
    const { data, error } = await supabase
      .from('applications')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('applications').delete().eq('id', id);
    if (error) throw error;
  },

  async getByStatus(status: string): Promise<Application[]> {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async count(): Promise<number> {
    const { count, error } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count || 0;
  }
};

// ============ FACTORY OPERATIONS ============

export const factoryService = {
  async getAll(): Promise<Factory[]> {
    const { data, error } = await supabase
      .from('factories')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Factory | null> {
    const { data, error } = await supabase
      .from('factories')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async create(factory: FactoryInsert): Promise<Factory> {
    const { data, error } = await supabase
      .from('factories')
      .insert(factory)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<FactoryInsert>): Promise<Factory> {
    const { data, error } = await supabase
      .from('factories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('factories').delete().eq('id', id);
    if (error) throw error;
  }
};

// ============ USER PROFILE OPERATIONS ============

export const userProfileService = {
  async getCurrent(): Promise<UserProfile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async upsert(profile: Partial<UserProfile>): Promise<UserProfile> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        ...profile,
        user_id: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// ============ REALTIME SUBSCRIPTIONS ============

export const subscribeToStaff = (callback: (payload: any) => void) => {
  return supabase
    .channel('staff-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'staff' }, callback)
    .subscribe();
};

export const subscribeToResumes = (callback: (payload: any) => void) => {
  return supabase
    .channel('resumes-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'resumes' }, callback)
    .subscribe();
};

export const subscribeToApplications = (callback: (payload: any) => void) => {
  return supabase
    .channel('applications-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, callback)
    .subscribe();
};

// Export configured status
export { isSupabaseConfigured };
