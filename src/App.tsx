/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Student, Inquiry, Certificate, UserSession } from './types';
import { 
  getStoredData, 
  saveStoredData, 
  safeLocalStorage,
  fetchStudentsFromSupabase,
  fetchInquiriesFromSupabase,
  fetchCertificatesFromSupabase,
  syncStudentsToSupabase,
  syncInquiriesToSupabase,
  syncCertificatesToSupabase,
  generateUUID,
  ensureValidUUIDs
} from './supabase';
import PublicSite from './components/PublicSite';
import AdminPanel from './components/AdminPanel';

export default function App() {
  // Database datasets loaded reactively
  const [students, setStudents] = useState<Student[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  // Current logged in Student session
  const [session, setSession] = useState<UserSession | null>(null);

  // Administrative Portal active view state
  const [showAdminPortal, setShowAdminPortal] = useState(false);

  // Reconcile database state on boot & auto-authenticate active session with fresh DB values
  useEffect(() => {
    const data = getStoredData();
    setStudents(data.students);
    setInquiries(data.inquiries);
    setCertificates(data.certificates);

    // Dynamic asynchronous synchronization with live Supabase backend if active
    const syncWithBackend = async () => {
      // 1. Cleanse existing local storage IDs to be valid UUIDs
      ensureValidUUIDs(data);
      setStudents(data.students);
      setInquiries(data.inquiries);
      setCertificates(data.certificates);
      saveStoredData(data);

      const liveStudents = await fetchStudentsFromSupabase();
      const liveInquiries = await fetchInquiriesFromSupabase();
      const liveCertificates = await fetchCertificatesFromSupabase();

      if (liveStudents !== null || liveInquiries !== null || liveCertificates !== null) {
        // Union Merge: merge local & remote records by ID so no data is ever lost
        const studentMap = new Map<string, Student>();
        data.students.forEach(s => studentMap.set(s.id, s));
        if (liveStudents) {
          liveStudents.forEach(s => studentMap.set(s.id, s));
        }
        const mergedStudents = Array.from(studentMap.values());

        const inquiryMap = new Map<string, Inquiry>();
        data.inquiries.forEach(i => inquiryMap.set(i.id, i));
        if (liveInquiries) {
          liveInquiries.forEach(i => inquiryMap.set(i.id, i));
        }
        const mergedInquiries = Array.from(inquiryMap.values());

        const certMap = new Map<string, Certificate>();
        data.certificates.forEach(c => certMap.set(c.id, c));
        if (liveCertificates) {
          liveCertificates.forEach(c => certMap.set(c.id, c));
        }
        const mergedCertificates = Array.from(certMap.values());

        setStudents(mergedStudents);
        setInquiries(mergedInquiries);
        setCertificates(mergedCertificates);
        saveStoredData({
          students: mergedStudents,
          inquiries: mergedInquiries,
          certificates: mergedCertificates
        });

        // Push any local-only records back to Supabase
        await syncStudentsToSupabase(mergedStudents);
        await syncInquiriesToSupabase(mergedInquiries);
        await syncCertificatesToSupabase(mergedCertificates);

        // Sync student portal active session with updated data
        const storedSession = safeLocalStorage.getItem('KCTC_STUDENT_SESSION');
        if (storedSession) {
          try {
            const parsed = JSON.parse(storedSession);
            const latestStudent = mergedStudents.find(s => s.id === parsed.id || s.email.toLowerCase() === parsed.email.toLowerCase());
            if (latestStudent) {
              const syncedSession: UserSession = {
                id: latestStudent.id,
                email: latestStudent.email,
                password: latestStudent.password,
                full_name: latestStudent.full_name,
                father_name: latestStudent.father_name,
                dob: latestStudent.dob,
                gender: latestStudent.gender,
                qualification: latestStudent.qualification,
                residence: latestStudent.residence,
                phone: latestStudent.phone,
                enrolled_course: latestStudent.enrolled_course,
                email_verified: latestStudent.email_verified,
                enrollment_status: latestStudent.enrollment_status
              };
              setSession(syncedSession);
              safeLocalStorage.setItem('KCTC_STUDENT_SESSION', JSON.stringify(syncedSession));
            }
          } catch (e) {
            console.error('Failed to parse student session after sync:', e);
          }
        }
      }
    };
    syncWithBackend();

    // Pull student portal auto-session if pre-saved
    const storedSession = safeLocalStorage.getItem('KCTC_STUDENT_SESSION');
    if (storedSession) {
      try {
        const parsed = JSON.parse(storedSession);
        // Find latest student details to keep status reactive
        const latestStudent = data.students.find(s => s.id === parsed.id || s.email.toLowerCase() === parsed.email.toLowerCase());
        if (latestStudent) {
          const syncedSession: UserSession = {
            id: latestStudent.id,
            email: latestStudent.email,
            password: latestStudent.password,
            full_name: latestStudent.full_name,
            father_name: latestStudent.father_name,
            dob: latestStudent.dob,
            gender: latestStudent.gender,
            qualification: latestStudent.qualification,
            residence: latestStudent.residence,
            phone: latestStudent.phone,
            enrolled_course: latestStudent.enrolled_course,
            email_verified: latestStudent.email_verified,
            enrollment_status: latestStudent.enrollment_status
          };
          setSession(syncedSession);
          safeLocalStorage.setItem('KCTC_STUDENT_SESSION', JSON.stringify(syncedSession));
        } else {
          setSession(parsed);
        }
      } catch (e) {
        console.error('Failed to parse previous student session:', e);
      }
    }
  }, []);

  // Update datasets securely & persist to local storage cache file
  const handleStudentsUpdate = (updated: Student[]) => {
    setStudents(updated);
    saveStoredData({ students: updated });
    syncStudentsToSupabase(updated);

    // Instantly reconcile current student's portal view if they are viewing live
    if (session) {
      const liveStudent = updated.find(s => s.id === session.id || s.email.toLowerCase() === session.email.toLowerCase());
      if (liveStudent) {
        const syncedSession: UserSession = {
          id: liveStudent.id,
          email: liveStudent.email,
          password: liveStudent.password,
          full_name: liveStudent.full_name,
          father_name: liveStudent.father_name,
          dob: liveStudent.dob,
          gender: liveStudent.gender,
          qualification: liveStudent.qualification,
          residence: liveStudent.residence,
          phone: liveStudent.phone,
          enrolled_course: liveStudent.enrolled_course,
          email_verified: liveStudent.email_verified,
          enrollment_status: liveStudent.enrollment_status
        };
        setSession(syncedSession);
        safeLocalStorage.setItem('KCTC_STUDENT_SESSION', JSON.stringify(syncedSession));
      }
    }
  };

  const handleInquiriesUpdate = (updated: Inquiry[]) => {
    setInquiries(updated);
    saveStoredData({ inquiries: updated });
    syncInquiriesToSupabase(updated);
  };

  const handleCertificatesUpdate = (updated: Certificate[]) => {
    setCertificates(updated);
    saveStoredData({ certificates: updated });
    syncCertificatesToSupabase(updated);
  };

  // Add individual enquiry
  const handleAddNewInquiry = (newInq: Omit<Inquiry, 'id' | 'created_at'>) => {
    const created: Inquiry = {
      id: generateUUID(),
      ...newInq,
      created_at: new Date().toISOString()
    };

    const updated = [created, ...inquiries];
    setInquiries(updated);
    saveStoredData({ inquiries: updated });
    syncInquiriesToSupabase(updated);
  };

  // Auth portal session transitions
  const handleStudentLogin = (loginSession: UserSession) => {
    setSession(loginSession);
    safeLocalStorage.setItem('KCTC_STUDENT_SESSION', JSON.stringify(loginSession));
  };

  // Register a new student
  const handleStudentRegister = (regData: Omit<Student, 'id' | 'created_at' | 'fees_paid' | 'fees_amount' | 'enrollment_status' | 'email_verified'>) => {
    const studentId = generateUUID();
    const newStudent: Student = {
      id: studentId,
      ...regData,
      fees_paid: false,
      fees_amount: 0,
      email_verified: true,
      enrollment_status: 'pending', // Starts with 'pending' until admin accepts or declines
      created_at: new Date().toISOString()
    };

    const updatedStudents = [...students, newStudent];
    handleStudentsUpdate(updatedStudents);

    // Establish student portal active session immediately
    const sessionPayload: UserSession = {
      id: studentId,
      email: regData.email,
      password: regData.password,
      full_name: regData.full_name,
      father_name: regData.father_name,
      dob: regData.dob,
      gender: regData.gender,
      qualification: regData.qualification,
      residence: regData.residence,
      phone: regData.phone,
      enrolled_course: regData.enrolled_course,
      email_verified: true,
      enrollment_status: 'pending'
    };
    setSession(sessionPayload);
    safeLocalStorage.setItem('KCTC_STUDENT_SESSION', JSON.stringify(sessionPayload));
  };

  // Verify student email address
  const handleVerifyStudentEmail = (email: string) => {
    const emailIndex = students.findIndex(s => s.email.toLowerCase() === email.toLowerCase());
    if (emailIndex !== -1) {
      const studentsCopy = [...students];
      studentsCopy[emailIndex].email_verified = true;
      setStudents(studentsCopy);
      saveStoredData({ students: studentsCopy });
      syncStudentsToSupabase(studentsCopy);
    }

    if (session && session.email.toLowerCase() === email.toLowerCase()) {
      const updatedSession = { ...session, email_verified: true };
      setSession(updatedSession);
      safeLocalStorage.setItem('KCTC_STUDENT_SESSION', JSON.stringify(updatedSession));
    }
  };

  const handleStudentLogout = () => {
    setSession(null);
    safeLocalStorage.removeItem('KCTC_STUDENT_SESSION');
  };

  return (
    <main className="min-h-screen transition-colors duration-300">
      {showAdminPortal ? (
        <AdminPanel 
          students={students}
          inquiries={inquiries}
          certificates={certificates}
          onUpdateStudents={handleStudentsUpdate}
          onUpdateInquiries={handleInquiriesUpdate}
          onUpdateCertificates={handleCertificatesUpdate}
          onCloseAdmin={() => setShowAdminPortal(false)}
        />
      ) : (
        <PublicSite 
          students={students}
          inquiries={inquiries}
          certificates={certificates}
          onAddInquiry={handleAddNewInquiry}
          onStudentLogin={handleStudentLogin}
          onStudentRegister={handleStudentRegister}
          onVerifyStudentEmail={handleVerifyStudentEmail}
          currentSession={session}
          onStudentLogout={handleStudentLogout}
          onToggleAdmin={() => setShowAdminPortal(true)}
        />
      )}
    </main>
  );
}
