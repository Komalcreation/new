/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';
import { Student, Inquiry, Certificate } from './types';

// Safe sandbox-resilient localStorage fallback handler
const memoryStorage: Record<string, string> = {};
export const safeLocalStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`localStorage.getItem failed for key "${key}":`, e);
      return memoryStorage[key] || null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`localStorage.setItem failed for key "${key}":`, e);
      memoryStorage[key] = value;
    }
  },
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`localStorage.removeItem failed for key "${key}":`, e);
      delete memoryStorage[key];
    }
  }
};

const DEFAULT_URL = 'https://nzjbuwepwdpctlpjljmh.supabase.co';
const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56amJ1d2Vwd2RwY3RscGpsam1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNTQ3MjksImV4cCI6MjA5NzgzMDcyOX0.lkuvtgU9AwLFQXcUvhyso6DMq5qc9Yom0crXi649hdo';
const DEFAULT_PUBLISHABLE_KEY = 'sb_publishable_HxAXlDXKAgCvvucZYoX77g_phS4NcBC';

export const getSupabaseConfig = () => {
  const url = safeLocalStorage.getItem('KCTC_SUPABASE_URL') || DEFAULT_URL;
  const key = safeLocalStorage.getItem('KCTC_SUPABASE_KEY') || DEFAULT_ANON_KEY;
  const publishableKey = safeLocalStorage.getItem('KCTC_SUPABASE_PUB_KEY') || DEFAULT_PUBLISHABLE_KEY;
  return { url, key, publishableKey };
};

// Create client instance dynamically
let clientInstance: any = null;
export const getSupabaseClient = () => {
  if (clientInstance) return clientInstance;
  const { url, key } = getSupabaseConfig();
  if (url && key && url.includes('supabase.co')) {
    try {
      clientInstance = createClient(url, key, {
        auth: {
          storage: safeLocalStorage,
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false
        }
      });
    } catch (e) {
      console.error('Supabase createClient failed to compile or construct:', e);
    }
  }
  return clientInstance;
};

// --- UUID GENERATION & ENFORCEMENT FOR RELATIONAL DATABASES ---
export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const isUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

export const ensureValidUUIDs = (data: { students: Student[]; inquiries: Inquiry[]; certificates: Certificate[] }) => {
  const idMap = new Map<string, string>();

  if (data.students) {
    data.students.forEach(student => {
      if (!student.id || !isUUID(student.id)) {
        const newId = generateUUID();
        idMap.set(student.id || '', newId);
        student.id = newId;
      }
    });
  }

  if (data.inquiries) {
    data.inquiries.forEach(inquiry => {
      if (!inquiry.id || !isUUID(inquiry.id)) {
        inquiry.id = generateUUID();
      }
    });
  }

  if (data.certificates) {
    data.certificates.forEach(certificate => {
      if (!certificate.id || !isUUID(certificate.id)) {
        certificate.id = generateUUID();
      }
    });
  }

  if (idMap.size > 0) {
    const storedSession = safeLocalStorage.getItem('KCTC_STUDENT_SESSION');
    if (storedSession) {
      try {
        const parsed = JSON.parse(storedSession);
        if (idMap.has(parsed.id)) {
          parsed.id = idMap.get(parsed.id)!;
          safeLocalStorage.setItem('KCTC_STUDENT_SESSION', JSON.stringify(parsed));
        }
      } catch (e) {
        console.error('Failed to map session ID during UUID conversion:', e);
      }
    }
  }
};

let cachedStudentsTable: string | null = null;
export const getStudentsTableName = async (client: any): Promise<string> => {
  if (cachedStudentsTable) return cachedStudentsTable;
  try {
    const { error: errAdmin } = await client.from('admin_students').select('id').limit(1);
    if (!errAdmin) {
      cachedStudentsTable = 'admin_students';
      return 'admin_students';
    }
    const { error: errStudents } = await client.from('students').select('id').limit(1);
    if (!errStudents) {
      cachedStudentsTable = 'students';
      return 'students';
    }
  } catch (e) {
    console.warn('Error detecting students table, using default profiles:', e);
  }
  cachedStudentsTable = 'profiles';
  return 'profiles';
};

export const setSupabaseConfig = (url: string, key: string, publishableKey?: string) => {
  safeLocalStorage.setItem('KCTC_SUPABASE_URL', url);
  safeLocalStorage.setItem('KCTC_SUPABASE_KEY', key);
  if (publishableKey) {
    safeLocalStorage.setItem('KCTC_SUPABASE_PUB_KEY', publishableKey);
  } else {
    safeLocalStorage.setItem('KCTC_SUPABASE_PUB_KEY', DEFAULT_PUBLISHABLE_KEY);
  }
  clientInstance = null; // force recreation on next get
  supabase = getSupabaseClient();
};

export const resetSupabaseConfig = () => {
  safeLocalStorage.removeItem('KCTC_SUPABASE_URL');
  safeLocalStorage.removeItem('KCTC_SUPABASE_KEY');
  safeLocalStorage.removeItem('KCTC_SUPABASE_PUB_KEY');
  clientInstance = null; // clear cached instance
  supabase = null;
};

const { publishableKey } = getSupabaseConfig();
export const supabasePublishableKey = publishableKey;

export let supabase = getSupabaseClient();

// --- INITIAL DEFAULT MOCK DATA ---
const INITIAL_STUDENTS: Student[] = [];

const INITIAL_INQUIRIES: Inquiry[] = [];

const INITIAL_CERTIFICATES: Certificate[] = [];

// --- GRAFEFUL HYBRID DATA ENGINE ---
export const getStoredData = () => {
  let students: Student[] = INITIAL_STUDENTS;
  let inquiries: Inquiry[] = INITIAL_INQUIRIES;
  let certificates: Certificate[] = INITIAL_CERTIFICATES;

  try {
    const studentsRaw = safeLocalStorage.getItem('KCTC_STUDENTS');
    if (studentsRaw) {
      students = JSON.parse(studentsRaw);
    } else {
      safeLocalStorage.setItem('KCTC_STUDENTS', JSON.stringify(INITIAL_STUDENTS));
    }
  } catch (e) {
    console.error('Failed to parse students raw data, resetting to initial:', e);
    safeLocalStorage.setItem('KCTC_STUDENTS', JSON.stringify(INITIAL_STUDENTS));
  }

  try {
    const inquiriesRaw = safeLocalStorage.getItem('KCTC_INQUIRIES');
    if (inquiriesRaw) {
      inquiries = JSON.parse(inquiriesRaw);
    } else {
      safeLocalStorage.setItem('KCTC_INQUIRIES', JSON.stringify(INITIAL_INQUIRIES));
    }
  } catch (e) {
    console.error('Failed to parse inquiries raw data, resetting to initial:', e);
    safeLocalStorage.setItem('KCTC_INQUIRIES', JSON.stringify(INITIAL_INQUIRIES));
  }

  try {
    const certificatesRaw = safeLocalStorage.getItem('KCTC_CERTIFICATES');
    if (certificatesRaw) {
      certificates = JSON.parse(certificatesRaw);
    } else {
      safeLocalStorage.setItem('KCTC_CERTIFICATES', JSON.stringify(INITIAL_CERTIFICATES));
    }
  } catch (e) {
    console.error('Failed to parse certificates raw data, resetting to initial:', e);
    safeLocalStorage.setItem('KCTC_CERTIFICATES', JSON.stringify(INITIAL_CERTIFICATES));
  }

  return { students, inquiries, certificates };
};

export const saveStoredData = (data: { students?: Student[]; inquiries?: Inquiry[]; certificates?: Certificate[] }) => {
  if (data.students) safeLocalStorage.setItem('KCTC_STUDENTS', JSON.stringify(data.students));
  if (data.inquiries) safeLocalStorage.setItem('KCTC_INQUIRIES', JSON.stringify(data.inquiries));
  if (data.certificates) safeLocalStorage.setItem('KCTC_CERTIFICATES', JSON.stringify(data.certificates));
};

// --- DYNAMIC ASYNC SUPABASE BACKEND SYNCHRONIZATION HELPERS ---

export const fetchStudentsFromSupabase = async (): Promise<Student[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const tableName = await getStudentsTableName(client);
    const { data, error } = await client.from(tableName).select('*');
    if (error) {
      console.error(`Supabase fetch from ${tableName} failed:`, error);
      throw error;
    }
    return data;
  } catch (err) {
    console.error('Error fetching students from Supabase backend:', err);
    return null;
  }
};

export const fetchInquiriesFromSupabase = async (): Promise<Inquiry[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client.from('inquiries').select('*');
    if (error) {
      console.error('Supabase fetch from inquiries failed:', error);
      throw error;
    }
    return data;
  } catch (err) {
    console.error('Error fetching inquiries from Supabase backend:', err);
    return null;
  }
};

export const fetchCertificatesFromSupabase = async (): Promise<Certificate[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client.from('certificates').select('*');
    if (error) {
      console.error('Supabase fetch from certificates failed:', error);
      throw error;
    }
    return data;
  } catch (err) {
    console.error('Error fetching certificates from Supabase backend:', err);
    return null;
  }
};

export const syncStudentsToSupabase = async (updated: Student[]) => {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    const tableName = await getStudentsTableName(client);

    if (updated.length === 0) {
      const { error } = await client.from(tableName).delete().neq('id', '_none_');
      if (error) console.error(`Failed to clear table ${tableName}:`, error);
      return;
    }

    // Pull current IDs in Supabase
    const { data: current, error } = await client.from(tableName).select('id');
    if (!error && current) {
      const dbKeys = current.map((d: any) => d.id);
      const updatedIds = new Set(updated.map(s => s.id));
      const toDelete = dbKeys.filter(id => !updatedIds.has(id));

      for (const id of toDelete) {
        const { error: delError } = await client.from(tableName).delete().eq('id', id);
        if (delError) console.error(`Failed to delete student ${id} from table ${tableName}:`, delError);
      }
    } else if (error) {
      console.error(`Failed to pull current IDs from ${tableName}:`, error);
    }

    // Upsert remaining list elements
    for (const item of updated) {
      const { error: upsertError } = await client.from(tableName).upsert(item);
      if (upsertError) {
        console.error(`Supabase upsert failed for student ${item.id} in table ${tableName}:`, upsertError);
      }
    }
  } catch (err) {
    console.error('Error synchronizing students to Supabase backend:', err);
  }
};

export const syncInquiriesToSupabase = async (updated: Inquiry[]) => {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    if (updated.length === 0) {
      const { error } = await client.from('inquiries').delete().neq('id', '_none_');
      if (error) console.error('Failed to clear inquiries table:', error);
      return;
    }

    const { data: current, error } = await client.from('inquiries').select('id');
    if (!error && current) {
      const dbKeys = current.map((d: any) => d.id);
      const updatedIds = new Set(updated.map(i => i.id));
      const toDelete = dbKeys.filter(id => !updatedIds.has(id));

      for (const id of toDelete) {
        const { error: delError } = await client.from('inquiries').delete().eq('id', id);
        if (delError) console.error(`Failed to delete inquiry ${id}:`, delError);
      }
    } else if (error) {
      console.error('Failed to pull current IDs from inquiries:', error);
    }

    for (const item of updated) {
      const { error: upsertError } = await client.from('inquiries').upsert(item);
      if (upsertError) {
        console.error(`Supabase upsert failed for inquiry ${item.id}:`, upsertError);
      }
    }
  } catch (err) {
    console.error('Error synchronizing inquiries to Supabase backend:', err);
  }
};

export const syncCertificatesToSupabase = async (updated: Certificate[]) => {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    if (updated.length === 0) {
      const { error } = await client.from('certificates').delete().neq('id', '_none_');
      if (error) console.error('Failed to clear certificates table:', error);
      return;
    }

    const { data: current, error } = await client.from('certificates').select('id');
    if (!error && current) {
      const dbKeys = current.map((d: any) => d.id);
      const updatedIds = new Set(updated.map(c => c.id));
      const toDelete = dbKeys.filter(id => !updatedIds.has(id));

      for (const id of toDelete) {
        const { error: delError } = await client.from('certificates').delete().eq('id', id);
        if (delError) console.error(`Failed to delete certificate ${id}:`, delError);
      }
    } else if (error) {
      console.error('Failed to pull current IDs from certificates:', error);
    }

    for (const item of updated) {
      const { error: upsertError } = await client.from('certificates').upsert(item);
      if (upsertError) {
        console.error(`Supabase upsert failed for certificate ${item.id}:`, upsertError);
      }
    }
  } catch (err) {
    console.error('Error synchronizing certificates to Supabase backend:', err);
  }
};

export const wipeAllBackendData = async () => {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    await client.from('inquiries').delete().neq('id', '_none_');
    await client.from('certificates').delete().neq('id', '_none_');
    const tableName = await getStudentsTableName(client);
    await client.from(tableName).delete().neq('id', '_none_');
  } catch (err) {
    console.error('Error clearing live data from Supabase backend:', err);
  }
};
