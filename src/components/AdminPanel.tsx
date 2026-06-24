/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Download, 
  Trash2, 
  Edit3, 
  Layers, 
  Search, 
  Filter, 
  Phone, 
  MapPin, 
  PlusCircle, 
  Database, 
  UserCheck, 
  X, 
  Sliders, 
  ArrowLeft,
  Settings,
  HelpCircle,
  FileCheck,
  RefreshCw,
  LogOut,
  AlertTriangle,
  Info
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Student, Inquiry, Certificate } from '../types';
import { getSupabaseConfig, setSupabaseConfig, resetSupabaseConfig, wipeAllBackendData, generateUUID } from '../supabase';

interface AdminPanelProps {
  students: Student[];
  inquiries: Inquiry[];
  certificates: Certificate[];
  onUpdateStudents: (updated: Student[]) => void;
  onUpdateInquiries: (updated: Inquiry[]) => void;
  onUpdateCertificates: (updated: Certificate[]) => void;
  onCloseAdmin: () => void;
}

export default function AdminPanel({
  students,
  inquiries,
  certificates,
  onUpdateStudents,
  onUpdateInquiries,
  onUpdateCertificates,
  onCloseAdmin
}: AdminPanelProps) {
  // Authentication State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Sidenav tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'inquiries' | 'certificates' | 'settings'>('overview');

  // Multi-search / filter parameters (Students)
  const [studentSearch, setStudentSearch] = useState('');
  const [studentCourseFilter, setStudentCourseFilter] = useState('');
  const [studentFeesFilter, setStudentFeesFilter] = useState('');
  const [studentStatusFilter, setStudentStatusFilter] = useState('');

  // Multi-search / filter (Inquiries)
  const [inquirySearch, setInquirySearch] = useState('');
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState('');

  // Certificates searching
  const [certSearch, setCertSearch] = useState('');

  // Database testing status
  const [dbStatus, setDbStatus] = useState<'idle' | 'testing' | 'connected' | 'error'>('idle');
  const [dbConfig, setDbConfig] = useState(getSupabaseConfig());

  // Edit Modals
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudent, setNewStudent] = useState<Partial<Student>>({
    full_name: '',
    father_name: '',
    dob: '',
    gender: 'Female',
    qualification: '',
    residence: '',
    phone: '',
    email: '',
    password: 'password123',
    enrolled_course: 'Advanced Fashion Designing Course',
    fees_paid: false,
    fees_amount: 0,
    email_verified: true,
    enrollment_status: 'accepted',
    notes: ''
  });

  // Certificate Issuance Form State
  const [newCert, setNewCert] = useState({
    student_name: '',
    father_name: '',
    roll_number: '',
    course_name: 'Advanced Fashion Designing Course',
    passing_year: new Date().getFullYear(),
    grade: 'A+',
    verification_code: '',
    certificate_image_url: 'https://images.unsplash.com/photo-1589330694653-ded6df53f6ee?auto=format&fit=crop&q=80&w=800'
  });

  // Student Delete confirmation dialog
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  // --- ADMIN LOGIN GATE ---
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const targetEmail1 = 'Universal8427@gmail.com'.toLowerCase();
    const targetEmail2 = 'admin@komalcreations.com'.toLowerCase();
    const providedEmail = adminEmail.trim().toLowerCase();
    
    if ((providedEmail === targetEmail1 || providedEmail === targetEmail2) && adminPassword === 'universal') {
      setIsAdminLoggedIn(true);
    } else {
      setLoginError('Incorrect Administrator login or password credentials.');
    }
  };

  // --- STATS COMPILATIONS ---
  const statsOverview = useMemo(() => {
    const totalStudentsCount = students.length;
    const verifiedStudentsCount = students.filter(s => s.enrollment_status === 'accepted').length;
    const totalStitchingRevenue = students.reduce((acc, s) => acc + (s.fees_paid ? s.fees_amount : 0), 0);
    const pendingStudentsCount = students.filter(s => !s.fees_paid).length;

    return {
      total: totalStudentsCount,
      verified: verifiedStudentsCount,
      revenue: totalStitchingRevenue,
      pending: pendingStudentsCount
    };
  }, [students]);

  // --- GRAPHICAL ANALYTICS BUILD ---
  const courseDistributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach(s => {
      counts[s.enrolled_course] = (counts[s.enrolled_course] || 0) + 1;
    });

    return Object.keys(counts).map(name => ({
      name: name.replace(' Course', ''),
      value: counts[name]
    }));
  }, [students]);

  const monthlyPaymentsData = useMemo(() => {
    // Collect simulated payment history elements
    return [
      { name: 'Jan', revenue: 15000 },
      { name: 'Feb', revenue: 22000 },
      { name: 'Mar', revenue: 18000 },
      { name: 'Apr', revenue: 35000 },
      { name: 'May', revenue: 47000 },
      { name: 'Jun', revenue: statsOverview.revenue }
    ];
  }, [statsOverview.revenue]);

  const PIE_COLORS = ['#501537', '#c5a059', '#7c2658', '#d6b87d', '#5a4b53'];

  // --- SEARCH & FILTERS CONTROLLERS ---
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSearch = s.full_name.toLowerCase().includes(studentSearch.toLowerCase()) || 
                          s.father_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                          s.email.toLowerCase().includes(studentSearch.toLowerCase());
      const matchCourse = studentCourseFilter ? s.enrolled_course === studentCourseFilter : true;
      const matchFees = studentFeesFilter 
        ? (studentFeesFilter === 'paid' ? s.fees_paid : !s.fees_paid) 
        : true;
      const matchStatus = studentStatusFilter 
        ? s.enrollment_status === studentStatusFilter 
        : true;

      return matchSearch && matchCourse && matchFees && matchStatus;
    });
  }, [students, studentSearch, studentCourseFilter, studentFeesFilter, studentStatusFilter]);

  const filteredInquiries = useMemo(() => {
    return inquiries.filter(inq => {
      const matchSearch = inq.full_name.toLowerCase().includes(inquirySearch.toLowerCase()) || 
                          inq.phone_number.includes(inquirySearch);
      const matchStatus = inquiryStatusFilter ? inq.status === inquiryStatusFilter : true;
      return matchSearch && matchStatus;
    });
  }, [inquiries, inquirySearch, inquiryStatusFilter]);

  const filteredCertificates = useMemo(() => {
    return certificates.filter(c => {
      return c.student_name.toLowerCase().includes(certSearch.toLowerCase()) ||
             c.roll_number.toLowerCase().includes(certSearch.toLowerCase()) ||
             c.verification_code.toLowerCase().includes(certSearch.toLowerCase());
    });
  }, [certificates, certSearch]);

  // --- ACTIONS HANDLERS ---
  // Save edited student
  const handleSaveStudentEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    const index = students.findIndex(s => s.id === editingStudent.id);
    if (index !== -1) {
      const updated = [...students];
      updated[index] = editingStudent;
      onUpdateStudents(updated);
      setEditingStudent(null);
    }
  };

  // Direct status updates (Accept or Decline)
  const handleUpdateStatus = (studentId: string, status: 'accepted' | 'declined') => {
    const updated = students.map(s => {
      if (s.id === studentId) {
        return { ...s, enrollment_status: status };
      }
      return s;
    });
    onUpdateStudents(updated);
  };

  // Add a new student manually
  const handleAddNewStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const created: Student = {
      id: generateUUID(),
      full_name: newStudent.full_name || 'Anonymous Student',
      father_name: newStudent.father_name || '-',
      dob: newStudent.dob || '',
      gender: newStudent.gender || 'Female',
      qualification: newStudent.qualification || '',
      residence: newStudent.residence || '-',
      phone: newStudent.phone || '-',
      email: newStudent.email || `${Math.random().toString(36).substr(2,5)}@kctc.com`,
      password: newStudent.password || 'password123',
      enrolled_course: newStudent.enrolled_course || 'Advanced Fashion Designing Course',
      fees_paid: newStudent.fees_paid || false,
      fees_amount: Number(newStudent.fees_amount) || 0,
      email_verified: true,
      enrollment_status: newStudent.enrollment_status || 'accepted',
      notes: newStudent.notes || '',
      created_at: new Date().toISOString()
    };

    onUpdateStudents([created, ...students]);
    setShowAddStudentModal(false);
    // Reset partial form
    setNewStudent({
      full_name: '',
      father_name: '',
      dob: '',
      gender: 'Female',
      qualification: '',
      residence: '',
      phone: '',
      email: '',
      password: 'password123',
      enrolled_course: 'Advanced Fashion Designing Course',
      fees_paid: false,
      fees_amount: 0,
      email_verified: true,
      enrollment_status: 'accepted',
      notes: ''
    });
  };

  // Delete student confirmed
  const handleTriggerDeleteStudent = () => {
    if (!studentToDelete) return;
    const filtered = students.filter(s => s.id !== studentToDelete.id);
    onUpdateStudents(filtered);
    setStudentToDelete(null);
  };

  // Inquiry triggers
  const handleInquiryAction = (id: string, action: 'contacted' | 'cancelled' | 'convert') => {
    const index = inquiries.findIndex(i => i.id === id);
    if (index === -1) return;

    const inqsCopy = [...inquiries];
    const item = inqsCopy[index];

    if (action === 'convert') {
      // Create new student structure matches inquiry
      const createdStudent: Student = {
        id: generateUUID(),
        full_name: item.full_name,
        father_name: '-',
        residence: 'Punjab, India',
        phone: item.phone_number,
        email: `${item.full_name.toLowerCase().replace(/\s+/g, '')}@kctc.com`,
        enrolled_course: item.course_interested,
        fees_paid: false,
        fees_amount: item.course_interested.includes('Advanced') ? 12000 : 4500,
        email_verified: true,
        enrollment_status: 'accepted',
        password: 'password123',
        notes: 'Converted automatically from lead inquiry logs.',
        created_at: new Date().toISOString()
      };

      onUpdateStudents([createdStudent, ...students]);
      item.status = 'enrolled';
    } else {
      item.status = action;
    }

    onUpdateInquiries(inqsCopy);
  };

  // Add new certificate ledger
  const handleIssueCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCert.student_name || !newCert.verification_code || !newCert.roll_number) {
      alert('Please fill in Student Name, Roll, and Verification code.');
      return;
    }

    const created: Certificate = {
      id: generateUUID(),
      student_name: newCert.student_name,
      father_name: newCert.father_name,
      roll_number: newCert.roll_number,
      course_name: newCert.course_name,
      passing_year: Number(newCert.passing_year) || 2026,
      grade: newCert.grade,
      verification_code: newCert.verification_code.toUpperCase(),
      certificate_image_url: newCert.certificate_image_url || undefined,
      created_at: new Date().toISOString()
    };

    onUpdateCertificates([created, ...certificates]);
    
    // Reset cert form
    setNewCert({
      student_name: '',
      father_name: '',
      roll_number: '',
      course_name: 'Advanced Fashion Designing Course',
      passing_year: 2026,
      grade: 'A+',
      verification_code: '',
      certificate_image_url: 'https://images.unsplash.com/photo-1589330694653-ded6df53f6ee?auto=format&fit=crop&q=80&w=800'
    });

    alert(`Certificate for ${created.student_name} successfully inserted onto the ledger!`);
  };

  // Delete certificate
  const handleDeleteCertificate = (id: string) => {
    if (window.confirm('Are you sure you want to delete this certificate from the ledger? This is non-reversible.')) {
      onUpdateCertificates(certificates.filter(c => c.id !== id));
    }
  };

  // Live Supabase tests query
  const testSupabaseConnection = () => {
    setDbStatus('testing');
    setTimeout(() => {
      // Simple mock trigger validation
      if (dbConfig.url.includes('supabase.co')) {
        setSupabaseConfig(dbConfig.url, dbConfig.key, dbConfig.publishableKey);
        setDbStatus('connected');
      } else {
        setDbStatus('error');
      }
    }, 1200);
  };

  // Clear Supabase back to local mock storage
  const handleResetSupabase = () => {
    resetSupabaseConfig();
    const config = getSupabaseConfig();
    setDbConfig(config);
    setDbStatus('idle');
    alert('DB config cleared. Platform now operating in safe offline local storage mode.');
  };

  // Clear all demo/testing records to start fresh with real student inputs
  const handleClearAllData = async () => {
    if (window.confirm('Are you sure you want to clear all current student, inquiry, and certificate records? This will delete all mock/testing entries in your browser and on your live backend database so you can start fresh with real students. This is non-reversible.')) {
      setDbStatus('testing');
      try {
        await wipeAllBackendData();
      } catch (err) {
        console.error('Failed to wipe backend data directly:', err);
      }
      onUpdateStudents([]);
      onUpdateInquiries([]);
      onUpdateCertificates([]);
      setDbStatus('idle');
      alert('All demo and testing data has been wiped successfully from both your local browser and live Supabase backend! You now have a completely clean database to register real students.');
    }
  };

  // CSV Generator downloader
  const exportStudentsToCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Student Name,Father Name,Residence,Contact Phone,Email,Course,Fees Paid,Amount,Email Verified\n';

    filteredStudents.forEach(s => {
      const row = [
        `"${s.full_name}"`,
        `"${s.father_name}"`,
        `"${s.residence}"`,
        `"${s.phone}"`,
        `"${s.email}"`,
        `"${s.enrolled_course}"`,
        s.fees_paid ? 'PAID' : 'UNPAID',
        s.fees_amount,
        s.email_verified ? 'VERIFIED' : 'PENDING'
      ].join(',');
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `KCTC_Grads_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      
      {/* Sidenav Header menu */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button 
            onClick={onCloseAdmin}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 md:hidden"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#501537] to-[#7c2658] text-white flex items-center justify-center font-bold">
              🛠️
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900 block leading-none">KCTC Admin desk</span>
              <span className="text-[10px] text-[#c5a059] font-bold tracking-widest uppercase mt-0.5 block">Ledger & Admissions Manager</span>
            </div>
          </div>
        </div>

        {isAdminLoggedIn && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <span className="text-xs font-bold text-slate-900 block leading-none">Universal Admin</span>
              <span className="text-[9px] text-emerald-500 font-semibold block mt-0.5">Authorized Level</span>
            </div>
            <button 
              onClick={() => setIsAdminLoggedIn(false)}
              className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-lg text-slate-400 font-semibold text-xs flex items-center gap-1 transition-colors"
              title="Logout session"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}
      </header>

      {!isAdminLoggedIn ? (
        // --- SECURE LOGIN OVERLAY ---
        <div className="flex-grow flex items-center justify-center p-6 bg-[#f1f5f9]">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-8"
          >
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-[#501537]/10 text-[#501537] flex items-center justify-center mx-auto mb-4">
                <Sliders className="w-7 h-7" />
              </div>
              <h2 className="font-serif font-black text-2xl text-slate-900">Admin Login Panel</h2>
              <p className="text-xs text-slate-500 mt-1">Authenticate administrative credentials to view database ledger entries.</p>
            </div>

            {loginError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-[#b03a2e] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="Universal8427@gmail.com"
                  className="px-4 py-2.5 border border-slate-200 rounded-xl outline-none text-sm text-slate-800"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Password</label>
                <input 
                  type="password" 
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="px-4 py-2.5 border border-slate-200 rounded-xl outline-none text-sm text-slate-800"
                />
              </div>

              <button 
                type="submit"
                className="w-full mt-2 py-3 bg-[#501537] hover:bg-[#7c2658] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md uppercase"
              >
                Go to Dashboard
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <button 
                onClick={onCloseAdmin}
                className="text-xs text-slate-500 hover:text-[#501537] decoration-dashed underline"
              >
                Back to Public Webpage
              </button>
            </div>
          </motion.div>
        </div>
      ) : (
        // --- ADMIN MAIN WORKSPACE ---
        <div className="flex-grow grid md:grid-cols-12">
          
          {/* Side navigation rail */}
          <aside className="md:col-span-3 bg-white border-r border-slate-200 p-4 flex flex-col gap-1">
            <button 
              onClick={() => setActiveTab('overview')} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors text-left ${activeTab === 'overview' ? 'bg-[#501537] text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Layers className="w-4 h-4" />
              <span>Overview Analytics</span>
            </button>

            <button 
              onClick={() => setActiveTab('students')} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors text-left ${activeTab === 'students' ? 'bg-[#501537] text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Users className="w-4 h-4" />
              <span>Student Enrollments</span>
            </button>

            <button 
              onClick={() => setActiveTab('inquiries')} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors text-left ${activeTab === 'inquiries' ? 'bg-[#501537] text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Inquiries Leads ({inquiries.filter(i=>i.status === 'new').length} New)</span>
            </button>

            <button 
              onClick={() => setActiveTab('certificates')} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors text-left ${activeTab === 'certificates' ? 'bg-[#501537] text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Certificate Ledger</span>
            </button>

            <button 
              onClick={() => setActiveTab('settings')} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors text-left ${activeTab === 'settings' ? 'bg-[#501537] text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Settings className="w-4 h-4" />
              <span>Database Settings</span>
            </button>

            <div className="flex-grow flex items-end p-2">
              <button 
                onClick={onCloseAdmin}
                className="w-full py-2.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-[10px] uppercase font-bold text-slate-500 tracking-wide text-center"
              >
                Return to Front-End website
              </button>
            </div>
          </aside>

          {/* Sidenav active screen viewport */}
          <main className="md:col-span-9 p-6 sm:p-8 overflow-y-auto max-h-[calc(100vh-73px)]">
            
            {/* OVERVIEW SECTION */}
            {activeTab === 'overview' && (
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="font-serif font-black text-2xl text-slate-900 mb-1">Administrative Overview</h2>
                  <p className="text-xs text-slate-500">Live summary indices compiled from local registration ledger log files.</p>
                </div>

                {/* Counters grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Total Students</span>
                      <strong className="block text-2xl font-extrabold text-slate-950 mt-1">{statsOverview.total}</strong>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 animate-pulse" />
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Approved Students</span>
                      <strong className="block text-2xl font-extrabold text-slate-950 mt-1">{statsOverview.verified}</strong>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Total Revenue</span>
                      <strong className="block text-2xl font-extrabold text-[#501537] mt-1">₹{statsOverview.revenue}</strong>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#501537]/5 text-[#501537] flex items-center justify-center shrink-0">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Fees Pending</span>
                      <strong className="block text-2xl font-extrabold text-slate-950 mt-1">{statsOverview.pending}</strong>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Analytical charts */}
                <div className="grid lg:grid-cols-2 gap-6">
                  
                  {/* Revenue area chart */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest border-b pb-2">Revenue Growth Stream</h3>
                    <div className="w-full h-[240px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyPaymentsData}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#501537" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#501537" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" fontSize={11} stroke="#64748b" />
                          <YAxis fontSize={11} stroke="#64748b" />
                          <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
                          <Area type="monotone" dataKey="revenue" stroke="#501537" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Course pie chart */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest border-b pb-2">Course Enroll Distribution</h3>
                    <div className="w-full h-[240px] flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={courseDistributionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {courseDistributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36} iconSize={8} iconType="circle" fontSize={10} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Recent enroll list */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest mb-0">Recent Enrollments</h3>
                    <button onClick={() => setActiveTab('students')} className="text-xs text-[#501537] font-bold hover:underline">View Student List</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 font-bold text-slate-500 border-b border-slate-100">
                          <th className="p-3">Student Name</th>
                          <th className="p-3">Registered Mobile</th>
                          <th className="p-3">Enrolled Course</th>
                          <th className="p-3">Fees status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {students.slice(0, 4).map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-3 font-semibold text-slate-900">{s.full_name}</td>
                            <td className="p-3 text-slate-600 font-medium">{s.phone}</td>
                            <td className="p-3 text-slate-600 truncate max-w-[220px]">{s.enrolled_course}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${s.fees_paid ? 'bg-emerald-50 text-[#2b704e]' : 'bg-amber-50 text-amber-600'}`}>
                                {s.fees_paid ? 'PAID' : 'PENDING'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* STUDENTS SECTION */}
            {activeTab === 'students' && (
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center sm:items-start select-none">
                  <div>
                    <h2 className="font-serif font-black text-2xl text-slate-900 mb-1">Student Register Books</h2>
                    <p className="text-xs text-slate-500">Edit profiles, manual write-ins, active records.</p>
                  </div>
                  <div className="flex gap-2 text-xs font-bold uppercase tracking-wider">
                    <button 
                      onClick={exportStudentsToCSV}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Export CSV</span>
                    </button>
                    <button 
                      onClick={() => setShowAddStudentModal(true)}
                      className="px-4 py-2 bg-[#501537] hover:bg-[#7c2658] text-white rounded-lg flex items-center gap-2"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Manually Add Student</span>
                    </button>
                  </div>
                </div>

                {/* Searches & Filters toolbar */}
                <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="Search name, phone, email..."
                      className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-slate-400"
                    />
                  </div>

                  <select
                    value={studentCourseFilter}
                    onChange={(e) => setStudentCourseFilter(e.target.value)}
                    className="px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-slate-400"
                  >
                    <option value="">All Courses</option>
                    <option value="Boutique Tailoring & Stitching Course">Boutique Tailoring</option>
                    <option value="Advanced Fashion Designing Course">Advanced Fashion</option>
                    <option value="Hand Embroidery & Zardozi Course">Hand Embroidery</option>
                  </select>

                  <select
                    value={studentFeesFilter}
                    onChange={(e) => setStudentFeesFilter(e.target.value)}
                    className="px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-slate-400"
                  >
                    <option value="">All Fees Status</option>
                    <option value="paid">Paid</option>
                    <option value="unpaid">Unpaid</option>
                  </select>

                  <select
                    value={studentStatusFilter}
                    onChange={(e) => setStudentStatusFilter(e.target.value)}
                    className="px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-slate-400"
                  >
                    <option value="">All Enrollment Statuses</option>
                    <option value="pending">Pending Requests</option>
                    <option value="accepted">Accepted Requests</option>
                    <option value="declined">Declined Requests</option>
                  </select>
                </div>

                {/* Primary Students Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 font-bold text-slate-500 border-b border-slate-100 uppercase tracking-widest">
                          <th className="p-3.5">Student Details</th>
                          <th className="p-3.5">Residence</th>
                          <th className="p-3.5">Program</th>
                          <th className="p-3.5">Fee Record</th>
                          <th className="p-3.5 text-center">Status</th>
                          <th className="p-3.5 text-right w-24">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredStudents.length > 0 ? (
                          filteredStudents.map((s) => (
                            <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-3.5">
                                <strong className="text-slate-900 block font-bold">{s.full_name}</strong>
                                <span className="text-[10px] text-slate-600 block">Father: {s.father_name}</span>
                                {s.dob && <span className="text-[10px] text-slate-600 block">DOB: {s.dob} | Gender: {s.gender || 'Female'}</span>}
                                {s.qualification && <span className="text-[10px] text-slate-600 block">Edu: {s.qualification}</span>}
                                <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{s.phone} | {s.email}</span>
                              </td>
                              <td className="p-3.5 text-slate-600 font-medium">{s.residence}</td>
                              <td className="p-3.5 text-slate-600 font-medium max-w-[180px] break-words">{s.enrolled_course}</td>
                              <td className="p-3.5">
                                <div className="flex flex-col gap-0.5">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold w-fit ${s.fees_paid ? 'bg-emerald-50 text-[#2b704e]' : 'bg-amber-50 text-amber-600'}`}>
                                    {s.fees_paid ? 'FEE PAID' : 'FEE PENDING'}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-bold mt-0.5">Amount: ₹{s.fees_amount}</span>
                                </div>
                              </td>
                              <td className="p-3.5 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                    s.enrollment_status === 'accepted' ? 'bg-emerald-50 text-[#2b704e]' :
                                    s.enrollment_status === 'declined' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                                  }`}>
                                    {(s.enrollment_status || 'pending').toUpperCase()}
                                  </span>
                                  
                                  <div className="flex gap-1 justify-center mt-1 scale-90">
                                    {(s.enrollment_status === 'pending' || !s.enrollment_status) && (
                                      <>
                                        <button 
                                          onClick={() => handleUpdateStatus(s.id, 'accepted')}
                                          className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[8px] font-bold shadow uppercase"
                                        >
                                          Accept
                                        </button>
                                        <button 
                                          onClick={() => handleUpdateStatus(s.id, 'declined')}
                                          className="px-1.5 py-0.5 bg-slate-300 hover:bg-red-600 text-slate-800 hover:text-white rounded text-[8px] font-bold uppercase"
                                        >
                                          Decline
                                        </button>
                                      </>
                                    )}
                                    {s.enrollment_status === 'accepted' && (
                                      <button 
                                        onClick={() => handleUpdateStatus(s.id, 'declined')}
                                        className="text-[9px] text-red-650 hover:underline hover:text-red-600"
                                      >
                                        Decline
                                      </button>
                                    )}
                                    {s.enrollment_status === 'declined' && (
                                      <button 
                                        onClick={() => handleUpdateStatus(s.id, 'accepted')}
                                        className="text-[9px] text-emerald-650 hover:underline"
                                      >
                                        Accept
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="p-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button 
                                    onClick={() => setEditingStudent(s)}
                                    className="p-1 text-slate-400 hover:text-slate-900 bg-slate-50 rounded border border-slate-200"
                                    title="Edit student profile"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => setStudentToDelete(s)}
                                    className="p-1 text-slate-400 hover:text-red-600 bg-red-50 hover:border-red-200 rounded border border-red-100"
                                    title="Delete student from register"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400 text-xs italic">
                              No student entries match current filter criteria.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* INQUIRIES SECTION */}
            {activeTab === 'inquiries' && (
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="font-serif font-black text-2xl text-slate-900 mb-1">Inquiries & Leads Tracker</h2>
                  <p className="text-xs text-slate-500">Contact leads, convert prospective admissions directly into student ledger logs.</p>
                </div>

                {/* Filters inquiries bar */}
                <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text"
                      value={inquirySearch}
                      onChange={(e) => setInquirySearch(e.target.value)}
                      placeholder="Search prospective names, phone..."
                      className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg outline-none"
                    />
                  </div>

                  <select
                    value={inquiryStatusFilter}
                    onChange={(e) => setInquiryStatusFilter(e.target.value)}
                    className="px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-600 font-semibold cursor-pointer bg-[#fdfbf7]"
                  >
                    <option value="">All Inquiries Statuses</option>
                    <option value="new">New Inquiries</option>
                    <option value="contacted">Contacted Leads</option>
                    <option value="enrolled">Enrolled Students</option>
                    <option value="cancelled">Cancelled/Archived</option>
                  </select>
                </div>

                {/* Inquiries interactive table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 font-bold text-slate-500 border-b border-slate-100 uppercase tracking-widest pl-3.5">
                          <th className="p-3.5">Lead Name</th>
                          <th className="p-3.5">Contact phone</th>
                          <th className="p-3.5">Program interest / Stitch order</th>
                          <th className="p-3.5">Status marker</th>
                          <th className="p-3.5 text-right w-48">Workflow Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredInquiries.length > 0 ? (
                          filteredInquiries.map((inq) => (
                            <tr key={inq.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-3.5 font-bold text-slate-900">{inq.full_name}</td>
                              <td className="p-3.5 font-mono font-medium text-slate-600">{inq.phone_number}</td>
                              <td className="p-3.5 text-slate-600 font-medium max-w-[200px] whitespace-normal break-words">{inq.course_interested}</td>
                              <td className="p-3.5">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                  inq.status === 'new' ? 'bg-blue-50 text-blue-600 font-black' :
                                  inq.status === 'contacted' ? 'bg-amber-50 text-amber-600' :
                                  inq.status === 'enrolled' ? 'bg-emerald-50 text-[#2b704e]' : 'bg-slate-100 text-slate-400'
                                }`}>
                                  {inq.status.toUpperCase()}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                  {inq.status === 'new' && (
                                    <button 
                                      onClick={() => handleInquiryAction(inq.id, 'contacted')}
                                      className="px-2 py-1 bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100 rounded text-[10px] font-bold"
                                    >
                                      Contacted
                                    </button>
                                  )}
                                  
                                  {inq.status !== 'enrolled' && inq.status !== 'cancelled' && (
                                    <button 
                                      onClick={() => handleInquiryAction(inq.id, 'convert')}
                                      className="px-2 py-1 bg-emerald-50 border border-emerald-200 text-[#2b704e] hover:bg-emerald-100 rounded text-[10px] font-bold flex items-center gap-0.5"
                                      title="Convert to Enrolled Student"
                                    >
                                      <UserCheck className="w-3 h-3" />
                                      <span>Enroll Ledger</span>
                                    </button>
                                  )}

                                  {inq.status !== 'cancelled' && (
                                    <button 
                                      onClick={() => handleInquiryAction(inq.id, 'cancelled')}
                                      className="px-2 py-1 bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-600 rounded text-[10px]"
                                    >
                                      Archive
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-400 text-xs italic">
                              No inquiry leads found. Check your search input.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* CERTIFICATE LEDGER */}
            {activeTab === 'certificates' && (
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="font-serif font-black text-2xl text-slate-900 mb-1">Secure Certificate Ledger Management</h2>
                  <p className="text-xs text-slate-500">Publish completed vocational degrees directly on the public verifying index ledger.</p>
                </div>

                <div className="grid lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Issuance Form Panel */}
                  <form onSubmit={handleIssueCertificate} className="lg:col-span-5 bg-white p-6 border border-slate-200 rounded-xl shadow-sm flex flex-col gap-4">
                    <h3 className="text-xs font-extrabold text-[#501537] uppercase tracking-widest border-b pb-2 flex items-center gap-1">
                      <PlusCircle className="w-4 h-4 text-[#c5a059]" />
                      <span>Publish New Degree log</span>
                    </h3>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recipient Name *</label>
                      <input 
                        type="text"
                        required
                        value={newCert.student_name}
                        onChange={(e) => setNewCert(prev => ({ ...prev, student_name: e.target.value }))}
                        placeholder="e.g. Priya Sharma"
                        className="px-3 py-2 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Father's Name *</label>
                      <input 
                        type="text"
                        required
                        value={newCert.father_name}
                        onChange={(e) => setNewCert(prev => ({ ...prev, father_name: e.target.value }))}
                        placeholder="e.g. Rajesh Sharma"
                        className="px-3 py-2 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">License ID / Roll *</label>
                        <input 
                          type="text"
                          required
                          value={newCert.roll_number}
                          onChange={(e) => setNewCert(prev => ({ ...prev, roll_number: e.target.value }))}
                          placeholder="KCTC-2026-XYZ"
                          className="px-3 py-2 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Graduation Year *</label>
                        <input 
                          type="number"
                          required
                          value={newCert.passing_year}
                          onChange={(e) => setNewCert(prev => ({ ...prev, passing_year: Number(e.target.value) }))}
                          placeholder="2026"
                          className="px-3 py-2 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed Program *</label>
                      <select
                        value={newCert.course_name}
                        onChange={(e) => setNewCert(prev => ({ ...prev, course_name: e.target.value }))}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-semibold"
                      >
                        <option value="Boutique Tailoring & Stitching Course">Boutique Tailoring Course</option>
                        <option value="Advanced Fashion Designing Course">Advanced Fashion Designing Course</option>
                        <option value="Hand Embroidery & Zardozi Course">Hand Embroidery & Zardozi Course</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Final Grade Awarded *</label>
                        <input 
                          type="text"
                          required
                          value={newCert.grade}
                          onChange={(e) => setNewCert(prev => ({ ...prev, grade: e.target.value }))}
                          placeholder="A+"
                          className="px-3 py-2 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verification ID *</label>
                        <input 
                          type="text"
                          required
                          value={newCert.verification_code}
                          onChange={(e) => setNewCert(prev => ({ ...prev, verification_code: e.target.value }))}
                          placeholder="KCTC-VERIFY-XYZ"
                          className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold uppercase"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mockup image URL</label>
                      <input 
                        type="url"
                        value={newCert.certificate_image_url}
                        onChange={(e) => setNewCert(prev => ({ ...prev, certificate_image_url: e.target.value }))}
                        placeholder="https://..."
                        className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-400"
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full mt-2 py-2.5 bg-[#501537] hover:bg-[#7c2658] text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm"
                    >
                      Issue/Upload Certificate log
                    </button>
                  </form>

                  {/* Issued ledger log list */}
                  <div className="lg:col-span-7 bg-white p-5 border border-slate-200 rounded-xl shadow-sm flex flex-col gap-4">
                    <div className="flex justify-between items-center pb-2 border-b">
                      <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest mb-0">Active Published Certificates</h3>
                      <div className="relative w-40">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input 
                          type="text"
                          value={certSearch}
                          onChange={(e) => setCertSearch(e.target.value)}
                          placeholder="Search cert name/code..."
                          className="w-full pl-8 pr-2 py-1 text-[11px] border rounded outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-3.5 max-h-[460px] overflow-y-auto pr-1">
                      {filteredCertificates.map((c) => (
                        <div key={c.id} className="border border-slate-100 rounded-lg p-3 bg-slate-50/50 flex justify-between items-start text-xs">
                          <div>
                            <strong className="text-slate-900 font-bold block">{c.student_name}</strong>
                            <p className="text-[10px] text-slate-500 font-medium">Roll: {c.roll_number} | Year: {c.passing_year} | Grade: {c.grade}</p>
                            <span className="inline-block mt-1 font-mono text-[9px] bg-[#c5a059]/10 text-[#c5a059] px-1.5 py-0.5 rounded font-black">
                              VERIFICATION ID: {c.verification_code}
                            </span>
                          </div>
                          <button 
                            onClick={() => handleDeleteCertificate(c.id)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Revoke certificate from ledger"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SETTINGS SECTION */}
            {activeTab === 'settings' && (
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="font-serif font-black text-2xl text-slate-900 mb-1">Database Settings Panel</h2>
                  <p className="text-xs text-slate-500">Configure or test your live Supabase database connections.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  
                  {/* Console settings connection */}
                  <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm flex flex-col gap-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b pb-2 flex items-center gap-2">
                      <Database className="w-4 h-4 text-[#c5a059]" />
                      <span>Live Supabase API Credentials</span>
                    </h3>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PROJECT URL</label>
                      <input 
                        type="text"
                        value={dbConfig.url}
                        onChange={(e) => setDbConfig(prev => ({ ...prev, url: e.target.value }))}
                        className="px-3 py-2 border rounded-lg text-xs font-mono"
                        placeholder="https://your-project.supabase.co"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PUBLIC ANON KEY</label>
                      <textarea
                        rows={3}
                        value={dbConfig.key}
                        onChange={(e) => setDbConfig(prev => ({ ...prev, key: e.target.value }))}
                        className="px-3 py-2 border rounded-lg text-xs font-mono leading-normal resize-none"
                        placeholder="eyJhbGciOi..."
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PUBLISHABLE KEY</label>
                      <input 
                        type="text"
                        value={dbConfig.publishableKey || ''}
                        onChange={(e) => setDbConfig(prev => ({ ...prev, publishableKey: e.target.value }))}
                        className="px-3 py-2 border rounded-lg text-xs font-mono"
                        placeholder="sb_publishable_..."
                      />
                    </div>

                    {dbStatus === 'connected' && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-lg text-[11px] font-bold flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        <span>Connected successfully to live database service! Settings saved.</span>
                      </div>
                    )}

                    {dbStatus === 'error' && (
                      <div className="p-3 bg-red-50 border border-red-200 text-[#b03a2e] rounded-lg text-[11px] font-bold flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>Failed to save. Ensure your keys are in standard 'supabase.co' layout matching structure.</span>
                      </div>
                    )}

                    <div className="flex gap-2.5 mt-2">
                      <button 
                        onClick={testSupabaseConnection}
                        disabled={dbStatus === 'testing'}
                        className="flex-grow py-2 px-4 bg-gradient-to-r from-[#501537] to-[#7c2658] hover:shadow text-white rounded-lg text-xs font-bold uppercase tracking-wide transition-all"
                      >
                        {dbStatus === 'testing' ? 'Testing Api...' : 'Save & Test API'}
                      </button>

                      <button 
                        onClick={handleResetSupabase}
                        className="py-2 px-4 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg text-xs font-bold uppercase"
                      >
                        Reset Defaults
                      </button>
                    </div>
                  </div>

                  {/* General settings support instructions */}
                  <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm text-xs text-slate-600 leading-relaxed flex flex-col gap-4">
                    <h3 className="text-xs font-bold uppercase text-slate-900 border-b pb-2 flex items-center gap-2">
                      <Info className="w-4 h-4 text-sky-500" />
                      <span>Schema Guides & Tables</span>
                    </h3>

                    <p>
                      To align this front-end app with your live Supabase, log in to your Supabase Console, navigate to the **SQL Editor**, and paste the initial schemas setup queries.
                    </p>

                    <p className="font-semibold text-slate-700">Required Schema Tables:</p>
                    <ul className="list-disc pl-5 space-y-1.5 font-mono text-[10px] text-slate-500">
                      <li><strong>inquiries</strong> (id, full_name, phone_number, age, course_interested, status, created_at)</li>
                      <li><strong>certificates</strong> (id, student_name, father_name, roll_number, course_name, passing_year, grade, verification_code, certificate_image_url)</li>
                      <li><strong>profiles</strong> / students (coupled through standard auth context sync)</li>
                    </ul>

                    <div className="bg-[#f0f9ff] text-[#0369a1] border border-[#b9e6fe] p-3 rounded-lg text-[10px] leading-relaxed mt-2.5">
                      <strong>* Dynamic Cache Protection:</strong> If client queries fail during network dropouts or database connection timeouts, the board automatically preserves write logs seamlessly into client state, saving inputs securely until reload.
                    </div>

                    <div className="border-t border-slate-150 pt-4 mt-2.5 flex flex-col gap-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-red-650">Testing Sandbox Clean Slate</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        If you are launching this system live and want to erase all initial mock students, inquiries, and demo certificate data to start with a blank database, click below.
                      </p>
                      <button
                        onClick={handleClearAllData}
                        className="w-full mt-1 py-2 px-3 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 text-red-700 font-bold rounded-lg text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Wipe All Demo & Testing Data</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      )}

      {/* --- ADD NEW STUDENT MANUALLY DIALOG-MODAL --- */}
      <AnimatePresence>
        {showAddStudentModal && (
          <div className="fixed inset-0 bg-slate-900/55 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border text-xs text-slate-600 rounded-xl shadow-xl p-6 w-full max-w-lg relative my-auto md:my-8"
            >
              <button 
                onClick={() => setShowAddStudentModal(false)}
                className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="font-serif font-bold text-xl text-slate-900 mb-4 pb-2 border-b">Add Student Record</h3>

              <form onSubmit={handleAddNewStudent} className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-400">FullName *</label>
                    <input 
                      type="text" 
                      required 
                      value={newStudent.full_name}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, full_name: e.target.value }))}
                      className="px-3 py-1.5 border rounded-lg"
                      placeholder="Priya Sharma"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-400">Father's Name *</label>
                    <input 
                      type="text" 
                      required 
                      value={newStudent.father_name}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, father_name: e.target.value }))}
                      className="px-3 py-1.5 border rounded-lg"
                      placeholder="Rajesh Sharma"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-400">Date of Birth *</label>
                    <input 
                      type="date" 
                      required 
                      value={newStudent.dob}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, dob: e.target.value }))}
                      className="px-3 py-1.5 border rounded-lg"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-400">Gender *</label>
                    <select
                      value={newStudent.gender}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, gender: e.target.value }))}
                      className="px-3 py-1.5 border rounded-lg bg-white"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-400">Education *</label>
                    <input 
                      type="text" 
                      required 
                      value={newStudent.qualification}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, qualification: e.target.value }))}
                      className="px-3 py-1.5 border rounded-lg"
                      placeholder="Graduation / Matric"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-400">Residence Town *</label>
                    <input 
                      type="text" 
                      required 
                      value={newStudent.residence}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, residence: e.target.value }))}
                      className="px-3 py-1.5 border rounded-lg"
                      placeholder="Punjab, India"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-400">Contact Number *</label>
                    <input 
                      type="tel" 
                      required 
                      value={newStudent.phone}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, phone: e.target.value }))}
                      className="px-3 py-1.5 border rounded-lg"
                      placeholder="+91 9876543210"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-400">Email Address *</label>
                    <input 
                      type="email" 
                      required 
                      value={newStudent.email}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, email: e.target.value }))}
                      className="px-3 py-1.5 border rounded-lg"
                      placeholder="student@example.com"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-400">Portal Password *</label>
                    <input 
                      type="text" 
                      required 
                      value={newStudent.password}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, password: e.target.value }))}
                      className="px-3 py-1.5 border rounded-lg"
                      placeholder="password123"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1 col-span-2">
                    <label className="font-bold text-slate-400">Stitching Program *</label>
                    <select
                      value={newStudent.enrolled_course}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, enrolled_course: e.target.value }))}
                      className="px-3 py-1.5 border rounded-lg bg-white w-full"
                    >
                      <option value="Boutique Tailoring & Stitching Course">Boutique Tailoring & Stitching Course</option>
                      <option value="Advanced Fashion Designing Course">Advanced Fashion Designing Course</option>
                      <option value="Hand Embroidery & Zardozi Course">Hand Embroidery & Zardozi Course</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border rounded-lg items-center">
                  <label className="flex items-center gap-2 font-bold text-[#501537] cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={newStudent.fees_paid}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, fees_paid: e.target.checked }))}
                    />
                    <span>Mark Fees Paid</span>
                  </label>
                  <div className="flex flex-col gap-0.5">
                    <label className="font-bold text-slate-400">Fee Amount (₹) *</label>
                    <input 
                      type="number" 
                      required
                      value={newStudent.fees_amount}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, fees_amount: Number(e.target.value) }))}
                      className="px-3 py-1 text-slate-800 border rounded"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-400">Enrollment Status *</label>
                    <select
                      value={newStudent.enrollment_status}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, enrollment_status: e.target.value as 'pending' | 'accepted' | 'declined' }))}
                      className="px-3 py-1.5 border rounded-lg bg-white"
                    >
                      <option value="accepted">Accepted</option>
                      <option value="pending">Pending</option>
                      <option value="declined">Declined</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 justify-end mt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowAddStudentModal(false)}
                    className="px-4 py-2 hover:bg-slate-50 text-slate-500 font-bold uppercase"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2.5 bg-[#501537] text-white rounded-lg font-bold uppercase shadow"
                  >
                    Insert Student
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- EDIT STUDENT DIALOG-MODAL --- */}
      <AnimatePresence>
        {editingStudent && (
          <div className="fixed inset-0 bg-slate-900/55 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border text-xs text-slate-600 rounded-xl shadow-xl p-6 w-full max-w-lg relative my-auto md:my-8"
            >
              <button 
                onClick={() => setEditingStudent(null)}
                className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="font-serif font-bold text-xl text-slate-900 mb-4 pb-2 border-b">Edit Student Profile</h3>

              <form onSubmit={handleSaveStudentEdit} className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-400">FullName *</label>
                    <input 
                      type="text" 
                      required 
                      value={editingStudent.full_name}
                      onChange={(e) => setEditingStudent(prev => prev ? ({ ...prev, full_name: e.target.value }) : null)}
                      className="px-3 py-1.5 border rounded-lg"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-400">Father Name *</label>
                    <input 
                      type="text" 
                      required 
                      value={editingStudent.father_name}
                      onChange={(e) => setEditingStudent(prev => prev ? ({ ...prev, father_name: e.target.value }) : null)}
                      className="px-3 py-1.5 border rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-400">Residence Town *</label>
                    <input 
                      type="text" 
                      required 
                      value={editingStudent.residence}
                      onChange={(e) => setEditingStudent(prev => prev ? ({ ...prev, residence: e.target.value }) : null)}
                      className="px-3 py-1.5 border rounded-lg"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-400">Phone Contact *</label>
                    <input 
                      type="tel" 
                      required 
                      value={editingStudent.phone}
                      onChange={(e) => setEditingStudent(prev => prev ? ({ ...prev, phone: e.target.value }) : null)}
                      className="px-3 py-1.5 border rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-400">Completed Program *</label>
                  <select
                    value={editingStudent.enrolled_course}
                    onChange={(e) => setEditingStudent(prev => prev ? ({ ...prev, enrolled_course: e.target.value }) : null)}
                    className="px-3 py-1.5 border rounded-lg bg-white"
                  >
                    <option value="Boutique Tailoring & Stitching Course">Boutique Tailoring Course</option>
                    <option value="Advanced Fashion Designing Course">Advanced Fashion Designing Course</option>
                    <option value="Hand Embroidery & Zardozi Course">Hand Embroidery & Zardozi Course</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border rounded-lg items-center">
                  <label className="flex items-center gap-2 font-bold text-[#501537] cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={editingStudent.fees_paid}
                      onChange={(e) => setEditingStudent(prev => prev ? ({ ...prev, fees_paid: e.target.checked }) : null)}
                    />
                    <span>Mark as paid</span>
                  </label>
                  <div className="flex flex-col gap-0.5">
                    <label className="font-bold text-slate-400">Pay Amount (₹) *</label>
                    <input 
                      type="number" 
                      required
                      value={editingStudent.fees_amount}
                      onChange={(e) => setEditingStudent(prev => prev ? ({ ...prev, fees_amount: Number(e.target.value) }) : null)}
                      className="px-3 py-1 text-slate-800 border rounded"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-400">Date of Birth</label>
                    <input 
                      type="date" 
                      value={editingStudent.dob || ''}
                      onChange={(e) => setEditingStudent(prev => prev ? ({ ...prev, dob: e.target.value }) : null)}
                      className="px-3 py-1.5 border rounded-lg"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-400">Gender</label>
                    <select
                      value={editingStudent.gender || 'Female'}
                      onChange={(e) => setEditingStudent(prev => prev ? ({ ...prev, gender: e.target.value }) : null)}
                      className="px-3 py-1.5 border rounded-lg bg-white"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-400">Qualification</label>
                    <input 
                      type="text" 
                      value={editingStudent.qualification || ''}
                      onChange={(e) => setEditingStudent(prev => prev ? ({ ...prev, qualification: e.target.value }) : null)}
                      className="px-3 py-1.5 border rounded-lg"
                      placeholder="Graduation / Matric"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-400">Portal Password</label>
                    <input 
                      type="text" 
                      value={editingStudent.password || 'password123'}
                      onChange={(e) => setEditingStudent(prev => prev ? ({ ...prev, password: e.target.value }) : null)}
                      className="px-3 py-1.5 border rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-400">Enrollment Status *</label>
                  <select
                    value={editingStudent.enrollment_status || 'pending'}
                    onChange={(e) => setEditingStudent(prev => prev ? ({ ...prev, enrollment_status: e.target.value as 'pending' | 'accepted' | 'declined' }) : null)}
                    className="px-3 py-1.5 border rounded-lg bg-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-400">Admin Notes / Comments</label>
                  <textarea 
                    rows={2}
                    value={editingStudent.notes || ''}
                    onChange={(e) => setEditingStudent(prev => prev ? ({ ...prev, notes: e.target.value }) : null)}
                    className="px-3 py-2 border rounded-lg resize-none"
                    placeholder="Enter additional remarks..."
                  />
                </div>

                <div className="flex gap-2 justify-end mt-4">
                  <button 
                    type="button" 
                    onClick={() => setEditingStudent(null)}
                    className="px-4 py-2 hover:bg-slate-50 text-slate-500 font-bold uppercase"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2.5 bg-[#501537] text-white rounded-lg font-bold uppercase shadow"
                  >
                    Save modifications
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CONFIRM STUDENTS DELETE DIALOG MODAL --- */}
      <AnimatePresence>
        {studentToDelete && (
          <div className="fixed inset-0 bg-slate-900/55 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border p-6 rounded-xl shadow-xl max-w-sm w-full text-xs text-slate-600 my-auto md:my-8"
            >
              <h3 className="font-serif font-bold text-lg text-slate-900 mb-2">Revoke Student enrollment?</h3>
              <p className="leading-relaxed mb-6">
                You are about to permanently delete the profile directory for <strong className="text-slate-900 font-bold">{studentToDelete.full_name}</strong>. This operation cannot be reversed.
              </p>
              
              <div className="flex gap-2 justify-end">
                <button 
                  onClick={() => setStudentToDelete(null)}
                  className="px-4 py-2 border rounded-lg text-slate-500 hover:bg-slate-50 font-bold uppercase"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleTriggerDeleteStudent}
                  className="px-4 py-2 bg-red-650 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold uppercase flex items-center gap-1 shadow"
                >
                  <X className="w-4 h-4" />
                  <span>Revoke student</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
