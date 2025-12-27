// React hooks for Supabase data fetching with realtime updates
// Replaces useLiveQuery from dexie-react-hooks

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import { staffService, resumeService, applicationService, factoryService, userProfileService } from './dataService';
import type { Staff, Resume, Application, Factory, UserProfile } from './database.types';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Counter for unique channel IDs (prevents memory leaks from random IDs)
let channelCounter = 0;

// Generic hook for data fetching with realtime updates
function useRealtimeQuery<T>(
  tableName: string,
  fetchFn: () => Promise<T>,
  deps: any[] = []
): T | undefined {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isMountedRef = useRef(true);

  const refetch = useCallback(async () => {
    try {
      const result = await fetchFn();
      if (isMountedRef.current) {
        setData(result);
      }
    } catch (error) {
      console.error(`Error fetching ${tableName}:`, error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetchFn, tableName]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    refetch();

    // Subscribe to realtime changes with stable channel ID
    const channelId = `${tableName}-changes-${++channelCounter}`;
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, () => {
        if (isMountedRef.current) {
          refetch();
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      isMountedRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [...deps, refetch]);

  return data;
}

// ============ STAFF HOOKS ============

export function useStaff(type?: 'GenzaiX' | 'Ukeoi'): Staff[] | undefined {
  return useRealtimeQuery<Staff[]>(
    'staff',
    () => staffService.getAll(type),
    [type]
  );
}

export function useStaffCount(type?: 'GenzaiX' | 'Ukeoi'): number | undefined {
  return useRealtimeQuery<number>(
    'staff',
    () => staffService.count(type),
    [type]
  );
}

export function useActiveStaffCount(): number | undefined {
  return useRealtimeQuery<number>(
    'staff',
    async () => {
      const { count, error } = await supabase
        .from('staff')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Active');
      if (error) throw error;
      return count || 0;
    },
    []
  );
}

// ============ RESUME HOOKS ============

export function useResumes(): Resume[] | undefined {
  return useRealtimeQuery<Resume[]>(
    'resumes',
    () => resumeService.getAll(),
    []
  );
}

export function useResumeCount(): number | undefined {
  return useRealtimeQuery<number>(
    'resumes',
    () => resumeService.count(),
    []
  );
}

// ============ APPLICATION HOOKS ============

export function useApplications(): Application[] | undefined {
  return useRealtimeQuery<Application[]>(
    'applications',
    () => applicationService.getAll(),
    []
  );
}

export function useApplicationCount(): number | undefined {
  return useRealtimeQuery<number>(
    'applications',
    () => applicationService.count(),
    []
  );
}

// ============ FACTORY HOOKS ============

export function useFactories(): Factory[] | undefined {
  return useRealtimeQuery<Factory[]>(
    'factories',
    () => factoryService.getAll(),
    []
  );
}

// ============ USER PROFILE HOOKS ============

export function useCurrentUserProfile(): UserProfile | null | undefined {
  return useRealtimeQuery<UserProfile | null>(
    'user_profiles',
    () => userProfileService.getCurrent(),
    []
  );
}

// ============ SETTINGS HOOK (for backward compatibility) ============

export function useSettings(key: string): any | undefined {
  const [value, setValue] = useState<any>(undefined);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const fetchSettings = async () => {
      const profile = await userProfileService.getCurrent();
      if (profile) {
        setValue(profile);
      }
    };

    fetchSettings();
  }, [key]);

  return value;
}

// Export data services for direct use
export { staffService, resumeService, applicationService, factoryService, userProfileService };
