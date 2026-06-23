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

const DEFAULT_URL = 'https://tawpkhxjnkjedkudapjw.supabase.co';
const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhd3BraHhqbmtqZWRrdWRhcGp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxOTE2MDEsImV4cCI6MjA5Nzc2NzYwMX0.hLhPcBMr13IhWd-ZkhWsiW8sbS40t2aVnRJXXhLgDKY';

export const getSupabaseConfig = () => {
  const url = safeLocalStorage.getItem('KCTC_SUPABASE_URL') || DEFAULT_URL;
  const key = safeLocalStorage.getItem('KCTC_SUPABASE_KEY') || DEFAULT_ANON_KEY;
  return { url, key };
};

export const setSupabaseConfig = (url: string, key: string) => {
  safeLocalStorage.setItem('KCTC_SUPABASE_URL', url);
  safeLocalStorage.setItem('KCTC_SUPABASE_KEY', key);
};

export const resetSupabaseConfig = () => {
  safeLocalStorage.removeItem('KCTC_SUPABASE_URL');
  safeLocalStorage.removeItem('KCTC_SUPABASE_KEY');
};

const { url, key } = getSupabaseConfig();

let clientInstance = null;
if (url && key) {
  try {
    clientInstance = createClient(url, key);
  } catch (e) {
    console.error('Supabase createClient failed to compile or construct:', e);
  }
}
export const supabase = clientInstance;

// --- INITIAL DEFAULT MOCK DATA ---
const INITIAL_STUDENTS: Student[] = [
  {
    id: 's1',
    full_name: 'Priya Sharma',
    father_name: 'Rajesh Sharma',
    dob: '2001-08-14',
    gender: 'Female',
    qualification: 'Bachelor of Arts (BA)',
    residence: 'Pune, Maharashtra',
    phone: '+91 9876543210',
    email: 'priya.sharma@example.com',
    password: 'password123',
    enrolled_course: 'Advanced Fashion Designing Course',
    fees_paid: true,
    fees_amount: 12000,
    email_verified: true,
    enrollment_status: 'accepted',
    notes: 'Outstanding student, active in practical projects',
    created_at: '2026-05-10T10:00:00Z',
  },
  {
    id: 's2',
    full_name: 'Snehal Deshmukh',
    father_name: 'Vijay Deshmukh',
    dob: '1999-04-23',
    gender: 'Female',
    qualification: '12th Standard',
    residence: 'Mumbai, Maharashtra',
    phone: '+91 9123456789',
    email: 'snehal.deshmukh@example.com',
    password: 'password123',
    enrolled_course: 'Boutique Tailoring & Stitching Course',
    fees_paid: true,
    fees_amount: 4500,
    email_verified: true,
    enrollment_status: 'accepted',
    notes: 'Alumna who has now successfully opened her custom dress center',
    created_at: '2026-04-15T11:30:00Z',
  },
  {
    id: 's3',
    full_name: 'Aaradhya Patel',
    father_name: 'Mukesh Patel',
    dob: '2003-11-05',
    gender: 'Female',
    qualification: '10th Standard',
    residence: 'Ahmedabad, Gujarat',
    phone: '+91 9988776655',
    email: 'aaradhya.patel@example.com',
    password: 'password123',
    enrolled_course: 'Hand Embroidery & Zardozi Course',
    fees_paid: false,
    fees_amount: 0,
    email_verified: false,
    enrollment_status: 'pending',
    notes: 'Needs to confirm exam schedule',
    created_at: '2026-06-01T09:15:00Z',
  }
];

const INITIAL_INQUIRIES: Inquiry[] = [
  {
    id: 'inq1',
    full_name: 'Meera Nair',
    phone_number: '+91 9445566778',
    age: 23,
    course_interested: 'Boutique Tailoring & Stitching Course',
    status: 'new',
    created_at: '2026-06-20T14:22:00Z',
  },
  {
    id: 'inq2',
    full_name: 'Sonia Gill',
    phone_number: '+91 9812345678',
    age: 28,
    course_interested: 'Advanced Fashion Designing Course',
    status: 'contacted',
    created_at: '2026-06-18T10:11:00Z',
  },
  {
    id: 'inq3',
    full_name: 'Riya Gupta',
    phone_number: '+91 9556677889',
    age: 20,
    course_interested: 'Hand Embroidery & Zardozi Course',
    status: 'enrolled',
    created_at: '2026-06-15T16:45:00Z',
  }
];

const INITIAL_CERTIFICATES: Certificate[] = [
  {
    id: 'cert1',
    student_name: 'Aaradhya Sharma',
    father_name: 'Rajesh Sharma',
    roll_number: 'KCTC-2025-089',
    course_name: 'Advanced Fashion Designing Course',
    passing_year: 2025,
    grade: 'A+',
    verification_code: 'KCTC-VERIFY-99A',
    certificate_image_url: 'https://images.unsplash.com/photo-1589330694653-ded6df53f6ee?auto=format&fit=crop&q=80&w=800',
    created_at: '2025-06-30T12:00:00Z',
  },
  {
    id: 'cert2',
    student_name: 'Priya Patel',
    father_name: 'Vijay Patel',
    roll_number: 'KCTC-2026-012',
    course_name: 'Hand Embroidery & Zardozi Course',
    passing_year: 2026,
    grade: 'A',
    verification_code: 'KCTC-VERIFY-12B',
    certificate_image_url: 'https://images.unsplash.com/photo-1606240724602-5b21f896eae8?auto=format&fit=crop&q=80&w=800',
    created_at: '2026-06-15T08:00:00Z',
  }
];

// --- GRAFEFUL HYBRID DATA ENGINE ---
export const getStoredData = () => {
  const studentsRaw = safeLocalStorage.getItem('KCTC_STUDENTS');
  const inquiriesRaw = safeLocalStorage.getItem('KCTC_INQUIRIES');
  const certificatesRaw = safeLocalStorage.getItem('KCTC_CERTIFICATES');

  const students: Student[] = studentsRaw ? JSON.parse(studentsRaw) : INITIAL_STUDENTS;
  const inquiries: Inquiry[] = inquiriesRaw ? JSON.parse(inquiriesRaw) : INITIAL_INQUIRIES;
  const certificates: Certificate[] = certificatesRaw ? JSON.parse(certificatesRaw) : INITIAL_CERTIFICATES;

  if (!studentsRaw) safeLocalStorage.setItem('KCTC_STUDENTS', JSON.stringify(INITIAL_STUDENTS));
  if (!inquiriesRaw) safeLocalStorage.setItem('KCTC_INQUIRIES', JSON.stringify(INITIAL_INQUIRIES));
  if (!certificatesRaw) safeLocalStorage.setItem('KCTC_CERTIFICATES', JSON.stringify(INITIAL_CERTIFICATES));

  return { students, inquiries, certificates };
};

export const saveStoredData = (data: { students?: Student[]; inquiries?: Inquiry[]; certificates?: Certificate[] }) => {
  if (data.students) safeLocalStorage.setItem('KCTC_STUDENTS', JSON.stringify(data.students));
  if (data.inquiries) safeLocalStorage.setItem('KCTC_INQUIRIES', JSON.stringify(data.inquiries));
  if (data.certificates) safeLocalStorage.setItem('KCTC_CERTIFICATES', JSON.stringify(data.certificates));
};
