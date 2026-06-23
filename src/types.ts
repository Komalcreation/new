/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Student {
  id: string;
  full_name: string;
  father_name: string;
  dob?: string;
  gender?: string;
  qualification?: string;
  residence: string;
  phone: string;
  email: string;
  password?: string;
  enrolled_course: string;
  fees_paid: boolean;
  fees_amount: number;
  email_verified: boolean; // Keep for fallback compatibility
  enrollment_status: 'pending' | 'accepted' | 'declined';
  notes?: string;
  created_at: string;
}

export interface Inquiry {
  id: string;
  full_name: string;
  phone_number: string;
  age?: number;
  course_interested: string;
  status: 'new' | 'contacted' | 'enrolled' | 'cancelled';
  created_at: string;
}

export interface Certificate {
  id: string;
  student_name: string;
  father_name: string;
  roll_number: string;
  course_name: string;
  passing_year: number;
  grade: string;
  verification_code: string;
  certificate_image_url?: string;
  created_at: string;
}

export interface UserSession {
  id: string;
  email: string;
  password?: string;
  full_name: string;
  father_name: string;
  dob?: string;
  gender?: string;
  qualification?: string;
  residence: string;
  phone: string;
  enrolled_course: string;
  email_verified: boolean;
  enrollment_status: 'pending' | 'accepted' | 'declined';
}

export type ApparelType = 'kurti' | 'suit' | 'lehenga' | 'blouse' | 'gown';
export type FabricType = 'cotton' | 'silk' | 'georgette' | 'velvet' | 'crepe';
export type SleeveType = 'sleeveless' | 'half' | 'full' | 'designer';

export interface EstimatorSummary {
  apparel: ApparelType;
  fabric: FabricType;
  sleeve: SleeveType;
  upgrades: { [key: string]: boolean };
  quantity: number;
  total: number;
}
