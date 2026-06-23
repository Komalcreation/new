/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Scissors, 
  Award, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  User, 
  Lock, 
  X, 
  ShieldCheck, 
  FileText, 
  GraduationCap, 
  Coins, 
  Shirt, 
  ChevronDown,
  Sparkles,
  Phone,
  MapPin,
  Mail,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  Student, 
  Inquiry, 
  Certificate, 
  UserSession, 
  ApparelType, 
  FabricType, 
  SleeveType, 
  EstimatorSummary 
} from '../types';
import { supabase } from '../supabase';

interface PublicSiteProps {
  students: Student[];
  inquiries: Inquiry[];
  certificates: Certificate[];
  onAddInquiry: (inq: Omit<Inquiry, 'id' | 'created_at'>) => void;
  onStudentLogin: (session: UserSession) => void;
  onStudentRegister?: (student: Omit<Student, 'id' | 'created_at' | 'fees_paid' | 'fees_amount'>) => void;
  onVerifyStudentEmail?: (email: string) => void;
  currentSession: UserSession | null;
  onStudentLogout: () => void;
  onToggleAdmin: () => void;
}

// Static creations data
const CREATIONS = [
  {
    id: 'c1',
    title: 'Royal Zardozi Lehenga',
    desc: 'A crimson silk lehenga intricately stitched with hand-embroidered gold zardozi motifs and stone embellishments.',
    category: 'ethnic',
    time: '15 Days',
    price: '₹14,999+',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'c2',
    title: 'Emerald Velvet Evening Gown',
    desc: 'Off-shoulder bodycon gown styled in rich emerald velvet with a pleated wrap flare and premium lining finishing.',
    category: 'western',
    time: '7 Days',
    price: '₹4,499+',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'c3',
    title: 'Handcrafted Aari Work Anarkali',
    desc: 'Premium pastel Georgette Anarkali suit showing heavy hand-crafted Aari thread embroidery along necklines and cuffs.',
    category: 'embroidery',
    time: '10 Days',
    price: '₹6,499+',
    image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'c4',
    title: 'Ivory Chantilly Lace Blouse',
    desc: 'Sheer crop designer blouse with fitted corset padding, intricate lacework trims, and decorative latkan buttons.',
    category: 'embroidery',
    time: '4 Days',
    price: '₹2,199+',
    image: 'https://images.unsplash.com/photo-1606240724602-5b21f896eae8?auto=format&fit=crop&q=80&w=800'
  }
];

// Testimonials
const TESTIMONIALS = [
  {
    quote: "Enrolling in the 6-Month Advanced Fashion Designing course at Komal Training Center was the turning point of my life. The master trainers taught me professional pattern cutting. Today, I run my own bridal boutique!",
    name: "Snehal Deshmukh",
    role: "Alumna, Batch of 2024"
  },
  {
    quote: "I got my bridal lehenga stitched here, and the hand Aari embroidery details were breathtaking. The fitting was custom-crafted and absolutely perfect on the first trial. I highly recommend Komal Creations.",
    name: "Riya Mehra",
    role: "Boutique Customer"
  },
  {
    quote: "The Online Ledger system is incredibly helpful. My employer validated my roll number directly on the website and verified my grades instantly. Extremely professional!",
    name: "Divya Nair",
    role: "Alumna, Batch of 2025"
  }
];

export default function PublicSite({
  students,
  inquiries,
  certificates,
  onAddInquiry,
  onStudentLogin,
  onStudentRegister,
  onVerifyStudentEmail,
  currentSession,
  onStudentLogout,
  onToggleAdmin
}: PublicSiteProps) {
  // Navigation active tab
  const [activeNav, setActiveNav] = useState('home');

  // Filter Boutique
  const [activeFilter, setActiveFilter] = useState('all');

  // Course search
  const [courseSearch, setCourseSearch] = useState('');

  // Estimator States
  const [selectedApparel, setSelectedApparel] = useState<ApparelType>('kurti');
  const [selectedFabric, setSelectedFabric] = useState<FabricType>('cotton');
  const [selectedSleeve, setSelectedSleeve] = useState<SleeveType>('half');
  const [upgrades, setUpgrades] = useState<{ [key: string]: boolean }>({
    lace: false,
    aari: false,
    tassels: false,
    lining: false
  });
  const [quantity, setQuantity] = useState(1);
  const [estimatedTotal, setEstimatedTotal] = useState(500);

  // Certificate Verification States
  const [verifyCodeInput, setVerifyCodeInput] = useState('');
  const [verifiedCertificate, setVerifiedCertificate] = useState<Certificate | null>(null);
  const [verifyError, setVerifyError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  // Inquiry Form States
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryAge, setInquiryAge] = useState('');
  const [inquiryInterest, setInquiryInterest] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Spam protection
  const [inquiryStatus, setInquiryStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Testimonials Slider
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  // Student Portal Auth Modal
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Form enrollment fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regFather, setRegFather] = useState('');
  const [regDob, setRegDob] = useState('');
  const [regGender, setRegGender] = useState('Female');
  const [regQualification, setRegQualification] = useState('');
  const [regResidence, setRegResidence] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCourse, setRegCourse] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Interactive Verification states
  const [enteredVerifyCode, setEnteredVerifyCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState('');

  // Slider Auto Rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Stitching Price calculation
  useEffect(() => {
    const BASE_PRICES: Record<ApparelType, number> = {
      kurti: 450,
      suit: 750,
      lehenga: 1800,
      blouse: 400,
      gown: 1500
    };

    const FABRIC_MULTIPLIER: Record<FabricType, number> = {
      cotton: 1.0,
      silk: 1.5,
      georgette: 1.3,
      velvet: 1.8,
      crepe: 1.2
    };

    const SLEEVE_PRICES: Record<SleeveType, number> = {
      sleeveless: 0,
      half: 50,
      full: 100,
      designer: 180
    };

    const UPGRADE_PRICES: Record<string, number> = {
      lace: 450,
      aari: 1200,
      tassels: 150,
      lining: 250
    };

    const base = BASE_PRICES[selectedApparel];
    const mult = FABRIC_MULTIPLIER[selectedFabric];
    let subtotal = base * mult;
    
    subtotal += SLEEVE_PRICES[selectedSleeve];

    Object.keys(upgrades).forEach((key) => {
      if (upgrades[key]) {
        subtotal += UPGRADE_PRICES[key];
      }
    });

    setEstimatedTotal(Math.round(subtotal * quantity));
  }, [selectedApparel, selectedFabric, selectedSleeve, upgrades, quantity]);

  // Handle Inquiry submission
  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInquiryStatus(null);

    // Spam-detection
    if (honeypot) {
      setInquiryStatus({
        type: 'success',
        text: 'Inquiry submitted successfully! We will contact you soon.'
      });
      return;
    }

    if (!inquiryName.trim() || !inquiryPhone.trim() || !inquiryInterest) {
      setInquiryStatus({
        type: 'error',
        text: 'Please fill in all required fields (Name, Phone, and Course interest).'
      });
      return;
    }

    const ageValue = inquiryAge ? parseInt(inquiryAge) : undefined;
    
    onAddInquiry({
      full_name: inquiryName,
      phone_number: inquiryPhone,
      age: ageValue,
      course_interested: inquiryInterest,
      status: 'new'
    });

    setInquiryStatus({
      type: 'success',
      text: 'Inquiry submitted successfully! Our representative will call/WhatsApp you shortly.'
    });

    // Reset form
    setInquiryName('');
    setInquiryPhone('');
    setInquiryAge('');
    setInquiryInterest('');
  };

  // Pre-fill enquiry with stitching request
  const handleApplyEstimateInquiry = () => {
    setInquiryInterest('Custom Boutique Design / Stitching Order');
    const element = document.getElementById('admission-inquiry');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setInquiryStatus({
      type: 'success',
      text: `Calculated custom estimate of ₹${estimatedTotal} loaded successfully! Please enter your name and contact details to proceed.`
    });
  };

  // Verify certificate
  const handleVerifyCertificate = () => {
    setVerifyError('');
    setVerifiedCertificate(null);
    setIsVerifying(true);

    setTimeout(() => {
      const code = verifyCodeInput.trim().toUpperCase();
      if (!code) {
        setVerifyError('Please enter a verification code.');
        setIsVerifying(false);
        return;
      }

      // First query input against our certificates list
      const matched = certificates.find(c => c.verification_code.toUpperCase() === code);
      if (matched) {
        setVerifiedCertificate(matched);
      } else {
        setVerifyError('No certificate record found matching this code. Please check your spelling.');
      }
      setIsVerifying(false);
    }, 800);
  };

  // Student login auth
  const handleStudentLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!loginEmail || !loginPassword) {
      setAuthError('Please fill in both fields.');
      return;
    }

    // Try finding matched student
    const student = students.find(s => s.email.toLowerCase() === loginEmail.toLowerCase());
    if (student) {
      onStudentLogin({
        id: student.id,
        email: student.email,
        password: student.password,
        full_name: student.full_name,
        father_name: student.father_name,
        dob: student.dob,
        gender: student.gender,
        qualification: student.qualification,
        residence: student.residence,
        phone: student.phone,
        enrolled_course: student.enrolled_course,
        email_verified: student.email_verified,
        enrollment_status: student.enrollment_status
      });
      setAuthSuccess('Logged in successfully!');
      setTimeout(() => {
        setShowAuthModal(false);
      }, 1000);
    } else {
      // Create fallback dummy student if none existed (interactive preview helper)
      if (loginEmail === 'test@student.com') {
        const dummyStudent: UserSession = {
          id: 'test-student',
          email: 'test@student.com',
          password: 'password123',
          full_name: 'Priya Deshmukh',
          father_name: 'Rajesh Deshmukh',
          dob: '2001-08-15',
          gender: 'Female',
          qualification: 'Graduate',
          residence: 'Pune, Maharashtra',
          phone: '+91 9876543210',
          enrolled_course: 'Advanced Fashion Designing Course',
          email_verified: true,
          enrollment_status: 'accepted'
        };
        onStudentLogin(dummyStudent);
        setAuthSuccess('Mock Student log-in successful!');
        setTimeout(() => {
          setShowAuthModal(false);
        }, 1000);
      } else {
        setAuthError('No registered student account was found under this email. Check credentials or Register.');
      }
    }
  };

  // Student registration auth
  const handleStudentRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!regName || !regFather || !regResidence || !regPhone || !regCourse || !regEmail || !regPassword || !regDob || !regGender || !regQualification) {
      setAuthError('Please fill in all registration fields.');
      return;
    }

    if (regPassword.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }

    const regPayload = {
      email: regEmail,
      password: regPassword,
      full_name: regName,
      father_name: regFather,
      dob: regDob,
      gender: regGender,
      qualification: regQualification,
      residence: regResidence,
      phone: regPhone,
      enrolled_course: regCourse,
      email_verified: true,
      enrollment_status: 'pending' as const
    };

    if (onStudentRegister) {
      onStudentRegister(regPayload);
    } else {
      // Capture registration as inquiry and log them in
      onStudentLogin({
        id: 'student_' + Math.random().toString(36).substr(2, 9),
        ...regPayload
      });
    }

    // Also inject as a lead/inquiry automatically
    onAddInquiry({
      full_name: regName,
      phone_number: regPhone,
      age: undefined,
      course_interested: regCourse,
      status: 'new'
    });

    setAuthSuccess('Success! Enrollment registration submitted. Your application is pending verification by our administrator. Login to view status!');
    
    // Clear registration fields
    setRegName('');
    setRegFather('');
    setRegDob('');
    setRegGender('Female');
    setRegQualification('');
    setRegResidence('');
    setRegPhone('');
    setRegCourse('');
    setRegEmail('');
    setRegPassword('');

    // Clear success banner
    setTimeout(() => {
      setAuthSuccess('');
    }, 4500);
  };

  // Enroll directly
  const handleDirectEnroll = (courseName: string) => {
    setAuthTab('register');
    setRegCourse(courseName);
    setShowAuthModal(true);
  };

  // Quick verification in playground/sandbox preview
  const handleQuickVerify = () => {
    if (onVerifyStudentEmail && currentSession) {
      onVerifyStudentEmail(currentSession.email);
      setVerificationSuccess('Success! Email verified dynamically. Welcome fully to Komal Creations Elite!');
      setTimeout(() => {
        setVerificationSuccess('');
      }, 5000);
    }
  };

  const handleVerifyWithCode = () => {
    setVerificationError('');
    setVerificationSuccess('');
    
    if (!currentSession) return;
    
    // Fallback code using random extraction if student_ prefix is not available, or standard default
    const idSeed = currentSession.id || 'student_xxx';
    const correctCode = `KCTC-${idSeed.substring(idSeed.length - 4).toUpperCase()}`;
    if (enteredVerifyCode.trim() === correctCode) {
      if (onVerifyStudentEmail) {
        onVerifyStudentEmail(currentSession.email);
      }
      setVerificationSuccess('Success! Code matches perfectly. Your academic record is now Verified!');
      setEnteredVerifyCode('');
      setTimeout(() => {
        setVerificationSuccess('');
      }, 5000);
    } else {
      setVerificationError(`Invalid Code. Please match the exact code from your mailbox: '${correctCode}'`);
    }
  };

  // Filter creation items
  const filteredCreations = activeFilter === 'all' 
    ? CREATIONS 
    : CREATIONS.filter(item => item.category === activeFilter);

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-[#2d1b25] selection:bg-[#c5a059] selection:text-white pb-12 font-sans overflow-x-hidden">
      
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-[#c5a059]/10 to-transparent blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-[40%] left-[-100px] w-[500px] h-[500px] bg-gradient-to-r from-[#501537]/5 to-transparent blur-[100px] pointer-events-none -z-10" />

      {/* --- PUBLIC SITE NAVIGATION HEADER --- */}
      <header className="sticky top-0 z-50 bg-[#fdfbf7]/80 backdrop-blur-md border-b border-[#501537]/10 py-4 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#501537] to-[#c5a059] text-white flex items-center justify-content justify-center font-serif font-bold text-lg shadow-md group-hover:scale-105 transition-all">
              K
            </div>
            <div>
              <span className="font-serif font-bold text-xl tracking-tight text-[#501537]">Komal Creations</span>
              <span className="block text-[10px] tracking-widest text-[#c5a059] uppercase font-semibold">Training Center</span>
            </div>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 font-medium text-sm text-[#5a4b53]">
            <a href="#home" onClick={() => setActiveNav('home')} className={`hover:text-[#501537] transition-colors relative ${activeNav === 'home' ? 'text-[#501537] font-semibold' : ''}`}>
              Home
              {activeNav === 'home' && <span className="absolute bottom-[-18px] left-0 w-full h-[3px] bg-[#c5a059] rounded-t-full" />}
            </a>
            <a href="#creations" onClick={() => setActiveNav('creations')} className={`hover:text-[#501537] transition-colors relative ${activeNav === 'creations' ? 'text-[#501537] font-semibold' : ''}`}>
              Creations
              {activeNav === 'creations' && <span className="absolute bottom-[-18px] left-0 w-full h-[3px] bg-[#c5a059] rounded-t-full" />}
            </a>
            <a href="#courses" onClick={() => setActiveNav('courses')} className={`hover:text-[#501537] transition-colors relative ${activeNav === 'courses' ? 'text-[#501537] font-semibold' : ''}`}>
              Courses
              {activeNav === 'courses' && <span className="absolute bottom-[-18px] left-0 w-full h-[3px] bg-[#c5a059] rounded-t-full" />}
            </a>
            <a href="#estimator" onClick={() => setActiveNav('estimator')} className={`hover:text-[#501537] transition-colors relative ${activeNav === 'estimator' ? 'text-[#501537] font-semibold' : ''}`}>
              Estimator
              {activeNav === 'estimator' && <span className="absolute bottom-[-18px] left-0 w-full h-[3px] bg-[#c5a059] rounded-t-full" />}
            </a>
            <a href="#verification" onClick={() => setActiveNav('verification')} className={`hover:text-[#501537] transition-colors relative ${activeNav === 'verification' ? 'text-[#501537] font-semibold' : ''}`}>
              Verification Ledger
              {activeNav === 'verification' && <span className="absolute bottom-[-18px] left-0 w-full h-[3px] bg-[#c5a059] rounded-t-full" />}
            </a>
          </nav>

          {/* User controls */}
          <div className="flex items-center gap-3">
            {currentSession ? (
              <button 
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-2 border border-[#c5a059] rounded-lg text-xs font-semibold text-[#501537] hover:bg-[#c5a059]/10 transition-colors flex items-center gap-2"
              >
                <GraduationCap className="w-4 h-4 text-[#c5a059]" />
                <span>Hi, {currentSession.full_name.split(' ')[0]}</span>
              </button>
            ) : (
              <button 
                onClick={() => { setAuthTab('login'); setShowAuthModal(true); }}
                className="px-4 py-2 border border-[#c5a059] rounded-lg text-xs font-semibold text-[#501537] hover:bg-[#c5a059]/10 transition-colors flex items-center gap-2"
              >
                <User className="w-3.5 h-3.5 text-[#c5a059]" />
                <span>Student Portal</span>
              </button>
            )}

            <button 
              onClick={onToggleAdmin}
              className="px-4 py-2 bg-gradient-to-r from-[#501537] to-[#7c2658] rounded-lg text-xs font-semibold text-white shadow-md hover:shadow-lg hover:scale-103 transition-all"
            >
              Admin Portal
            </button>
          </div>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section id="home" className="max-w-7xl mx-auto px-6 py-16 md:py-24 grid md:grid-template-columns md:grid-cols-2 gap-12 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -30 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#c5a059]/10 border border-[#c5a059]/20 rounded-full w-fit">
            <Award className="w-4 h-4 text-[#c5a059]" />
            <span className="text-xs font-semibold tracking-wider text-[#c5a059] uppercase">Boutique & Vocational Excellence</span>
          </div>

          <h1 className="font-serif font-bold text-4xl sm:text-5xl md:text-6xl text-[#501537] leading-[1.1] tracking-tight">
            Where <span className="text-[#c5a059] italic font-medium">Boutique Styling</span> Meets Master Learning
          </h1>

          <p className="text-[#5a4b53] text-base sm:text-lg max-w-xl leading-relaxed">
            Welcome to KCTC. Discover our exclusive handcrafted bridal couture, customized styling stitches, and premium vocational fashion certification studies tailored to nurture the designer entrepreneur in you.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <a href="#creations" className="px-6 py-3 bg-[#501537] text-white hover:bg-[#7c2658] font-semibold text-sm rounded-xl shadow-md transition-all">
              Explore Creations
            </a>
            <a href="#courses" className="px-6 py-3 border-2 border-[#c5a059] text-[#501537] hover:bg-[#c5a059] hover:text-white font-semibold text-sm rounded-xl transition-all">
              Join Our Academy
            </a>
          </div>
        </motion.div>

        {/* Hero visual elements */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative flex justify-center items-center"
        >
          <div className="w-full max-w-[420px] h-[480px] bg-gradient-to-br from-[#f6f0ea] to-[#fdfbf7] rounded-3xl overflow-hidden shadow-2xl border border-[#501537]/5 sticky z-10">
            <img 
              src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800" 
              alt="Tailoring design in process"
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
            />
          </div>

          {/* Floating cards */}
          <div className="absolute bottom-6 left-[-20px] bg-white/90 backdrop-blur-md border border-[#501537]/10 p-4 rounded-2xl shadow-xl flex items-center gap-3 z-20 animate-bounce" style={{ animationDuration: '4s' }}>
            <div className="w-10 h-10 rounded-xl bg-[#501537]/10 flex items-center justify-center text-[#501537]">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-xs text-[#501537]">100% Customized Fit</p>
              <p className="text-[10px] text-[#5a4b53]">Perfect stitching guaranteed</p>
            </div>
          </div>

          <div className="absolute top-10 right-[-10px] bg-white/95 backdrop-blur-md border border-[#c5a059]/20 p-4 rounded-2xl shadow-xl text-center flex flex-col gap-1 z-20">
            <span className="font-serif font-black text-2xl text-[#c5a059]">1000+</span>
            <span className="text-[9px] font-bold text-[#5a4b53] tracking-wider uppercase">Vocation Graduates</span>
          </div>
        </motion.div>
      </section>

      {/* --- CREATIONS SHOWCASE --- */}
      <section id="creations" className="bg-[#f6f0ea]/50 py-20 border-t border-b border-[#501537]/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#501537] mb-3 relative inline-block">
              Our Designer Creations
              <span className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-12 h-1 bg-[#c5a059] rounded-full" />
            </h2>
            <p className="text-sm text-[#5a4b53] mt-4">
              Inspect our hand-picked portfolio of custom ethnic suits, festive bridal wear, and sleek modern western gowns crafted in-house.
            </p>
          </div>

          {/* Filter Categories */}
          <div className="flex justify-center gap-2 flex-wrap mb-10">
            {['all', 'ethnic', 'western', 'embroidery'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-all ${
                  activeFilter === cat 
                    ? 'bg-[#501537] text-white shadow-md' 
                    : 'bg-white hover:bg-[#501537]/5 text-[#5a4b53] border border-[#501537]/10'
                }`}
              >
                {cat === 'all' ? 'Show All' : cat}
              </button>
            ))}
          </div>

          {/* Creations Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredCreations.map((item) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  key={item.id}
                  className="bg-white rounded-2xl border border-[#501537]/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden flex flex-col"
                >
                  <div className="h-[280px] overflow-hidden relative">
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-108"
                    />
                    <span className="absolute top-4 right-4 bg-[#501537]/90 text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full border border-white/20">
                      {item.category}
                    </span>
                  </div>

                  <div className="p-5 flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="font-serif font-bold text-lg text-[#501537] mb-2">{item.title}</h3>
                      <p className="text-xs text-[#5a4b53] leading-relaxed mb-4">{item.desc}</p>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-[#501537]/5 mt-4">
                      <span className="text-[10px] font-semibold text-[#5a4b53]">Time: {item.time}</span>
                      <span className="font-bold text-[#c5a059] text-sm">{item.price}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* --- CERTIFICATE EXAMINER & ONLINE LEDGER VERIFICATION --- */}
      <section id="verification" className="py-20 bg-gradient-to-br from-[#fdfbf7] via-[#f1eeea] to-[#fdfbf7]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#501537] mb-3 relative inline-block">
              Online Certificate Verification Ledger
              <span className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-12 h-1 bg-[#c5a059] rounded-full" />
            </h2>
            <p className="text-sm text-[#5a4b53] mt-4">
              Verify legal vocational training qualifications, rolls, and grades issued by KCTC academy. Secure authentic blockchain-equivalent ledger logs.
            </p>
          </div>

          {/* Verification input unit */}
          <div className="bg-white/90 backdrop-blur-sm border border-[#501537]/10 p-8 rounded-2xl shadow-xl text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-[#c5a059]/10 flex items-center justify-center text-[#c5a059] mx-auto mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <h3 className="font-serif font-bold text-xl text-[#501537] mb-1">Enter Student Verification ID</h3>
            <p className="text-xs text-[#5a4b53] mb-6">Type the unique ledger ID located at the bottom of the degree credential sheet.</p>

            <div className="flex gap-2 max-w-md mx-auto">
              <input 
                type="text" 
                value={verifyCodeInput}
                onChange={(e) => setVerifyCodeInput(e.target.value)}
                placeholder="e.g. KCTC-VERIFY-99A"
                className="flex-grow px-4 py-3 rounded-xl border border-[#501537]/20 outline-none focus:border-[#501537] text-sm text-[#501537] uppercase"
              />
              <button 
                onClick={handleVerifyCertificate}
                disabled={isVerifying}
                className="px-6 py-3 bg-[#501537] hover:bg-[#7c2658] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isVerifying ? 'Searching...' : 'Verify Ledger'}
              </button>
            </div>
            <div className="text-[10px] text-[#5a4b53] mt-2.5 text-left max-w-md mx-auto italic pl-1">
              * Verification is case-sensitive. Test entries: KCTC-VERIFY-99A or KCTC-VERIFY-12B
            </div>

            {/* Error notifications */}
            {verifyError && (
              <div className="mt-6 flex items-center gap-2 text-xs md:text-sm text-[#b03a2e] bg-[#b03a2e]/10 px-4 py-3 rounded-lg w-fit mx-auto">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{verifyError}</span>
              </div>
            )}
          </div>

          {/* Certificate display layout */}
          {verifiedCertificate && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12"
            >
              <div className="bg-white text-[#1a0f15] p-8 sm:p-12 border-[16px] border-double border-[#c5a059] rounded-lg shadow-2xl relative text-center">
                
                {/* Vintage decorative header */}
                <div className="mb-6 font-serif">
                  <h3 className="text-2xl sm:text-3xl font-bold tracking-wider text-[#501537]">KOMAL CREATIONS</h3>
                  <p className="text-[10px] tracking-[4px] uppercase text-[#c5a059] font-bold">and Training Center Academy</p>
                </div>

                <div className="font-serif italic text-sm text-[#5a4b53] mb-4">This is to certify that student</div>

                <div className="font-serif text-3xl font-extrabold text-[#1a0f15] border-b border-[#501537]/20 pb-2 px-8 inline-block mb-4">
                  {verifiedCertificate.student_name}
                </div>

                <div className="max-w-lg mx-auto text-sm text-[#5a4b53] leading-relaxed mb-8">
                  daughter of <strong className="text-[#501537] font-semibold">Mr. {verifiedCertificate.father_name}</strong> has successfully completed the vocational academy course and examinations in <strong>{verifiedCertificate.course_name}</strong> and was awarded this degree of completion with passing Grade <strong>{verifiedCertificate.grade}</strong>.
                </div>

                <div className="grid grid-cols-3 items-end gap-4 mt-8 border-t border-[#501537]/10 pt-6">
                  <div>
                    <div className="font-mono text-xs font-bold text-[#1a0f15]">{verifiedCertificate.roll_number}</div>
                    <div className="text-[9px] uppercase tracking-wider text-[#5a4b53] mt-1 border-t border-[#501537]/10 pt-1">Roll Number</div>
                  </div>

                  <div className="flex justify-center">
                    <div className="w-[64px] h-[64px] rounded-full bg-gradient-to-r from-[#e5cc96] to-[#c5a059] text-white font-bold text-[8px] flex items-center justify-center border-2 border-dashed border-white uppercase text-center select-none shadow-md">
                      VERIFIED<br />KCTC LEDGER
                    </div>
                  </div>

                  <div>
                    <div className="font-mono text-xs font-bold text-[#1a0f15]">{verifiedCertificate.passing_year}</div>
                    <div className="text-[9px] uppercase tracking-wider text-[#5a4b53] mt-1 border-t border-[#501537]/10 pt-1">Passing Year</div>
                  </div>
                </div>

                <div className="mt-8 pt-4 font-mono text-[9px] text-gray-400">
                  Secured Verification Ledger Log ID: {verifiedCertificate.verification_code}
                </div>
              </div>

              {/* View scanned attachment button */}
              {verifiedCertificate.certificate_image_url && (
                <div className="mt-6 flex justify-center">
                  <button 
                    onClick={() => setShowCertificateModal(true)}
                    className="px-5 py-2.5 bg-white text-[#501537] border border-[#501537]/20 hover:bg-[#501537]/5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
                  >
                    <FileText className="w-4 h-4 text-[#c5a059]" />
                    <span>View Scanned Physical Certificate</span>
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </section>

      {/* --- COURSES SECTION (ACADEMY FORUM) --- */}
      <section id="courses" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#501537] mb-3 relative inline-block">
              Our Vocational Certification Courses
              <span className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-12 h-1 bg-[#c5a059] rounded-full" />
            </h2>
            <p className="text-sm text-[#5a4b53] mt-4">
              Nurture your styling talent with hands-on curriculums. From absolute drafting novices to advanced bridal designers.
            </p>
          </div>

          {/* Quick Filter Search */}
          <div className="max-w-md mx-auto mb-12 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5" />
            <input 
              type="text" 
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
              placeholder="Search courses (e.g. stitching, tailoring)..."
              className="w-full pl-11 pr-4 py-3 rounded-full border border-[#501537]/10 outline-none focus:border-[#501537] text-sm text-[#501537]"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className={`p-6 bg-[#fdfbf7] rounded-2xl border border-[#501537]/10 flex flex-col justify-between hover:border-[#c5a059] hover:shadow-xl transition-all ${
              courseSearch && !'Boutique Tailoring & Stitching'.toLowerCase().includes(courseSearch.toLowerCase()) ? 'hidden' : ''
            }`}>
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#c5a059]/10 text-[#c5a059] flex items-center justify-center font-bold text-xl mb-4">
                  ✂️
                </div>
                <h3 className="font-serif font-bold text-xl text-[#501537] mb-2">Boutique Tailoring & Stitching</h3>
                <p className="text-xs text-[#5a4b53] leading-relaxed mb-6">
                  Learn complete blueprint drafting, scissor cutting, and high-performance stitching for everyday garments like Kurtis, Salwars, blouses, pants, and plazos.
                </p>
              </div>

              <div>
                <div className="flex gap-4 border-t border-[#501537]/5 pt-4 mb-4 text-xs text-[#5a4b53]">
                  <span>Duration: <strong>3 Months</strong></span>
                  <span>Level: <strong>Beginner</strong></span>
                </div>
                <button 
                  onClick={() => handleDirectEnroll('Boutique Tailoring & Stitching Course')}
                  className="w-full py-2.5 bg-white border border-[#c5a059] hover:bg-[#c5a059] hover:text-white rounded-xl text-xs font-semibold text-[#501537] transition-all"
                >
                  Quick Enroll Now
                </button>
              </div>
            </div>

            <div className={`p-6 bg-[#fdfbf7] rounded-2xl border border-[#501537]/10 flex flex-col justify-between hover:border-[#c5a059] hover:shadow-xl transition-all ${
              courseSearch && !'Advanced Fashion Designing'.toLowerCase().includes(courseSearch.toLowerCase()) ? 'hidden' : ''
            }`}>
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#c5a059]/10 text-[#c5a059] flex items-center justify-center font-bold text-xl mb-4">
                  📐
                </div>
                <h3 className="font-serif font-bold text-xl text-[#501537] mb-2">Advanced Fashion Designing</h3>
                <p className="text-xs text-[#5a4b53] leading-relaxed mb-6">
                  Master advanced high-fashion collars, designer puff sleeves, tailored jackets, ethnic heavy bridal wear, and corset gown creations.
                </p>
              </div>

              <div>
                <div className="flex gap-4 border-t border-[#501537]/5 pt-4 mb-4 text-xs text-[#5a4b53]">
                  <span>Duration: <strong>6 Months</strong></span>
                  <span>Level: <strong>Advanced</strong></span>
                </div>
                <button 
                  onClick={() => handleDirectEnroll('Advanced Fashion Designing Course')}
                  className="w-full py-2.5 bg-white border border-[#c5a059] hover:bg-[#c5a059] hover:text-white rounded-xl text-xs font-semibold text-[#501537] transition-all"
                >
                  Quick Enroll Now
                </button>
              </div>
            </div>

            <div className={`p-6 bg-[#fdfbf7] rounded-2xl border border-[#501537]/10 flex flex-col justify-between hover:border-[#c5a059] hover:shadow-xl transition-all ${
              courseSearch && !'Hand Embroidery & Zardozi'.toLowerCase().includes(courseSearch.toLowerCase()) ? 'hidden' : ''
            }`}>
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#c5a059]/10 text-[#c5a059] flex items-center justify-center font-bold text-xl mb-4">
                  🧵
                </div>
                <h3 className="font-serif font-bold text-xl text-[#501537] mb-2">Hand Embroidery & Zardozi</h3>
                <p className="text-xs text-[#5a4b53] leading-relaxed mb-6">
                  Master signature hand stitching techniques like Kashmiri, Aari thread work, pearl beads attachments, gold Zardozi, and floral patch designs.
                </p>
              </div>

              <div>
                <div className="flex gap-4 border-t border-[#501537]/5 pt-4 mb-4 text-xs text-[#5a4b53]">
                  <span>Duration: <strong>2 Months</strong></span>
                  <span>Level: <strong>All Levels</strong></span>
                </div>
                <button 
                  onClick={() => handleDirectEnroll('Hand Embroidery & Zardozi Course')}
                  className="w-full py-2.5 bg-white border border-[#c5a059] hover:bg-[#c5a059] hover:text-white rounded-xl text-xs font-semibold text-[#501537] transition-all"
                >
                  Quick Enroll Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- PRICE ESTIMATOR (COST CALCULATOR) --- */}
      <section id="estimator" className="py-20 bg-[#f6f0ea]/50 border-t border-b border-[#501537]/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#501537] mb-3 relative inline-block">
              Custom Stitching Cost Estimator
              <span className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-12 h-1 bg-[#c5a059] rounded-full" />
            </h2>
            <p className="text-sm text-[#5a4b53] mt-4">
              Select your specifications and features to instantly estimate your custom clothing tailoring charge (approximate rate).
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            {/* Options configuration */}
            <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-2xl border border-[#501537]/10 shadow-sm flex flex-col gap-6">
              
              {/* Apparel */}
              <div>
                <label className="block text-xs font-bold text-[#5a4b53] uppercase tracking-wider mb-3">1. Select Apparel Choice</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { id: 'kurti', label: 'Designer Kurti', icon: '👚' },
                    { id: 'suit', label: 'Salwar Suit', icon: '👗' },
                    { id: 'lehenga', label: 'Bridal Lehenga', icon: '💃' },
                    { id: 'blouse', label: 'Saree Blouse', icon: '🎽' },
                    { id: 'gown', label: 'Western Gown', icon: '👗' }
                  ].map((app) => (
                    <button
                      key={app.id}
                      onClick={() => setSelectedApparel(app.id as ApparelType)}
                      className={`p-4 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition-all ${
                        selectedApparel === app.id
                          ? 'border-[#501537] bg-[#501537]/5 scale-103 shadow-inner'
                          : 'border-[#501537]/10 bg-[#fdfbf7] hover:border-[#501537]/30'
                      }`}
                    >
                      <span className="text-2xl">{app.icon}</span>
                      <span className="text-xs font-bold text-[#501537]">{app.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fabric */}
              <div>
                <label className="block text-xs font-bold text-[#5a4b53] uppercase tracking-wider mb-2.5">2. Choose Fabric Material</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'cotton', label: 'Pure Cotton' },
                    { id: 'silk', label: 'Banarasi Silk (+50%)' },
                    { id: 'georgette', label: 'Georgette (+30%)' },
                    { id: 'velvet', label: 'Luxury Velvet (+80%)' },
                    { id: 'crepe', label: 'Crepe Satin (+20%)' }
                  ].map((fab) => (
                    <button
                      key={fab.id}
                      onClick={() => setSelectedFabric(fab.id as FabricType)}
                      className={`px-4 py-2 text-xs font-semibold rounded-full border transition-all ${
                        selectedFabric === fab.id
                          ? 'bg-[#c5a059] text-white border-[#c5a059]'
                          : 'bg-[#fdfbf7] text-[#5a4b53] border-[#501537]/10 hover:border-[#501537]/20'
                      }`}
                    >
                      {fab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sleeve */}
              <div>
                <label className="block text-xs font-bold text-[#5a4b53] uppercase tracking-wider mb-2.5">3. Sleeve Styling Setup</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'sleeveless', label: 'Sleeveless (₹0)' },
                    { id: 'half', label: 'Half / Normal (+₹50)' },
                    { id: 'full', label: 'Full Sleeves (+₹100)' },
                    { id: 'designer', label: 'Bell Puff Designer (+₹180)' }
                  ].map((slv) => (
                    <button
                      key={slv.id}
                      onClick={() => setSelectedSleeve(slv.id as SleeveType)}
                      className={`px-4 py-2 text-xs font-semibold rounded-full border transition-all ${
                        selectedSleeve === slv.id
                          ? 'bg-[#c5a059] text-white border-[#c5a059]'
                          : 'bg-[#fdfbf7] text-[#5a4b53] border-[#501537]/10 hover:border-[#501537]/20'
                      }`}
                    >
                      {slv.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Decorative Addons */}
              <div>
                <label className="block text-xs font-bold text-[#5a4b53] uppercase tracking-wider mb-2.5">4. Stylist Decorative Addons</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'lace', label: 'Heavy Border Lace (+₹450)' },
                    { id: 'aari', label: 'Heavy Aari Threadwork (+₹1200)' },
                    { id: 'tassels', label: 'Dori & Latkan Tassels (+₹150)' },
                    { id: 'lining', label: 'Double Inner Lining (+₹250)' }
                  ].map((upg) => (
                    <label key={upg.id} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#501537]/10 text-xs font-semibold text-[#5a4b53] cursor-pointer hover:bg-gray-50">
                      <input 
                        type="checkbox" 
                        checked={upgrades[upg.id] || false}
                        onChange={(e) => setUpgrades(prev => ({ ...prev, [upg.id]: e.target.checked }))}
                        className="accent-[#501537] w-4 h-4 shrink-0"
                      />
                      <span>{upg.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-bold text-[#5a4b53] uppercase tracking-wider mb-2.5">5. Quantity (garments)</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className="flex-grow accent-[#501537] h-1.5 bg-gray-200 rounded-lg outline-none cursor-pointer"
                  />
                  <span className="text-sm font-bold text-[#501537] w-12 text-right">{quantity} Pcs</span>
                </div>
              </div>
            </div>

            {/* Calculations outputs */}
            <div className="lg:col-span-4 bg-gradient-to-br from-[#501537] to-[#7c2658] p-6 rounded-2xl shadow-xl text-white">
              <h3 className="font-serif font-bold text-xl mb-4 border-b border-white/20 pb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#c5a059]" />
                <span>Estimate Stitches</span>
              </h3>

              <div className="flex flex-col gap-3.5 text-xs text-white/80">
                <div className="flex justify-between">
                  <span>Clothing:</span>
                  <strong className="text-white capitalize">{selectedApparel}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Fabric style:</span>
                  <strong className="text-white capitalize">{selectedFabric}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Sleeve length:</span>
                  <strong className="text-white capitalize">{selectedSleeve}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Quantity:</span>
                  <strong className="text-white">{quantity} unit(s)</strong>
                </div>

                <div className="border-t border-white/20 pt-4 mt-2 flex justify-between items-baseline">
                  <span className="text-sm font-semibold">Stitching Total:</span>
                  <strong className="text-2xl font-black text-[#e5cc96]">₹{estimatedTotal}</strong>
                </div>
              </div>

              <button 
                onClick={handleApplyEstimateInquiry}
                className="w-full mt-6 py-3 bg-[#c5a059] hover:bg-[#e5cc96] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md hover:scale-103"
              >
                Send Order Estimate
              </button>

              <p className="text-[10px] text-white/50 text-center leading-relaxed mt-4">
                * Note: Estimation excludes base fabric cost. Stitching quote is customizable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- INQUIRY FORM SECTION --- */}
      <section id="admission-inquiry" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          
          <div className="flex flex-col gap-6">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#501537] leading-tight">
              Ready to Start Your <span className="text-[#c5a059] italic font-medium">Creative Career</span>?
            </h2>
            <p className="text-sm text-[#5a4b53] leading-relaxed">
              Submit your info. Whether you want to place a custom tailoring stitch request or check out enrollment space for our physical certificate programs, submit this form and our head academy counselor will respond back via call/WhatsApp.
            </p>

            <div className="flex flex-col gap-5 mt-4 text-[#5a4b53]">
              <div className="flex gap-4 items-start font-medium text-sm">
                <div className="p-2.5 rounded-lg bg-[#501537]/5 text-[#c5a059] shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-[#501537] text-xs uppercase tracking-wide mb-1">Academy Campus Location</h4>
                  <p className="text-xs">E-Block Sector 12, KCTC Plaza, Main Market, Punjab, India</p>
                </div>
              </div>

              <div className="flex gap-4 items-start font-medium text-sm">
                <div className="p-2.5 rounded-lg bg-[#501537]/5 text-[#c5a059] shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-[#501537] text-xs uppercase tracking-wide mb-1">Enquiry Phone & WhatsApp</h4>
                  <p className="text-xs">+91 98765 43210 / +91 91234 56789</p>
                </div>
              </div>

              <div className="flex gap-4 items-start font-medium text-sm">
                <div className="p-2.5 rounded-lg bg-[#501537]/5 text-[#c5a059] shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-[#501537] text-xs uppercase tracking-wide mb-1">Official E-Mail Support</h4>
                  <p className="text-xs">admissions@komalcreations.com / info@komalcreations.com</p>
                </div>
              </div>
            </div>
          </div>

          {/* Submission card */}
          <div className="bg-[#f6f0ea]/50 border border-[#501537]/10 p-6 sm:p-8 rounded-2xl shadow-lg">
            <h3 className="font-serif font-bold text-2xl text-[#501537] mb-6">Send Inquiry Details</h3>

            {inquiryStatus && (
              <div className={`mb-6 p-4 rounded-xl text-xs sm:text-sm font-medium leading-relaxed ${
                inquiryStatus.type === 'success' 
                  ? 'bg-emerald-50 text-[#2b704e] border border-[#2b704e]/25' 
                  : 'bg-red-50 text-[#b03a2e] border border-[#b03a2e]/25'
              }`}>
                {inquiryStatus.text}
              </div>
            )}

            <form onSubmit={handleInquirySubmit} className="flex flex-col gap-4">
              
              {/* Spam protection Honeypot */}
              <div className="absolute opacity-0 pointer-events-none -z-20 h-0 w-0">
                <label htmlFor="website_address">Bot block field</label>
                <input 
                  type="text" 
                  id="website_address" 
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  autoComplete="off"
                  tabIndex={-1}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#5a4b53] uppercase tracking-wider">Full Name *</label>
                  <input 
                    type="text" 
                    required
                    value={inquiryName}
                    onChange={(e) => setInquiryName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="px-4 py-2.5 border border-[#501537]/10 rounded-xl bg-white focus:border-[#501537] text-sm outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#5a4b53] uppercase tracking-wider">Phone / WhatsApp *</label>
                  <input 
                    type="tel" 
                    required
                    value={inquiryPhone}
                    onChange={(e) => setInquiryPhone(e.target.value)}
                    placeholder="e.g. +91 9876543210"
                    className="px-4 py-2.5 border border-[#501537]/10 rounded-xl bg-white focus:border-[#501537] text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#5a4b53] uppercase tracking-wider">Age (Optional)</label>
                  <input 
                    type="number" 
                    value={inquiryAge}
                    onChange={(e) => setInquiryAge(e.target.value)}
                    placeholder="e.g. 21"
                    className="px-4 py-2.5 border border-[#501537]/10 rounded-xl bg-white focus:border-[#501537] text-sm outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#5a4b53] uppercase tracking-wider">Interested Course *</label>
                  <select 
                    required
                    value={inquiryInterest}
                    onChange={(e) => setInquiryInterest(e.target.value)}
                    className="px-4 py-2.5 border border-[#501537]/10 rounded-xl bg-white focus:border-[#501537] text-sm outline-none text-[#501537] font-medium"
                  >
                    <option value="" disabled>-- Select Option --</option>
                    <option value="Boutique Tailoring & Stitching Course">Boutique Tailoring Course (3 Mos)</option>
                    <option value="Advanced Fashion Designing Course">Advanced Fashion Designing (6 Mos)</option>
                    <option value="Hand Embroidery & Zardozi Course">Hand Embroidery & Zardozi (2 Mos)</option>
                    <option value="Custom Boutique Design / Stitching Order">Custom Boutique Stitching Order</option>
                    <option value="General Enquiry">General Enquiry / Info check</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full mt-2 py-3 bg-[#501537] hover:bg-[#7c2658] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Inquiry details</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* --- TESTIMONIALS --- */}
      <section className="py-20 bg-[#f6f0ea]/50 border-t border-b border-[#501537]/5">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#501537] mb-3 relative inline-block">
              Success Stories & Testimonials
              <span className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-12 h-1 bg-[#c5a059] rounded-full" />
            </h2>
          </div>

          <div className="relative overflow-hidden min-h-[220px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={testimonialIndex}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4 }}
                className="p-3 max-w-2xl focus:outline-none"
              >
                <p className="font-serif italic text-lg sm:text-xl text-[#501537] leading-relaxed mb-6">
                  &ldquo;{TESTIMONIALS[testimonialIndex].quote}&rdquo;
                </p>
                <h4 className="font-bold text-[#501537] text-sm">{TESTIMONIALS[testimonialIndex].name}</h4>
                <p className="text-[10px] uppercase font-bold text-[#c5a059] mt-0.5">{TESTIMONIALS[testimonialIndex].role}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dots slider navigator */}
          <div className="flex justify-center gap-2 mt-4">
            {TESTIMONIALS.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setTestimonialIndex(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${testimonialIndex === idx ? 'bg-[#501537] scale-120' : 'bg-[#501537]/20 hover:bg-[#501537]/40'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* --- STUDENT AUTH MODAL & PROFILE SHEET --- */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 bg-[#120a0f]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#fdfbf7] border border-[#501537]/10 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative my-auto md:my-8"
            >
              <button 
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-[#501537] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Logged in display */}
              {currentSession ? (
                <div>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-[#c5a059]/10 text-[#c5a059] flex items-center justify-center mx-auto mb-3">
                      <GraduationCap className="w-8 h-8" />
                    </div>
                    <h3 className="font-serif font-bold text-2xl text-[#501537]" id="welcome-text">Student Profile Desk</h3>
                    <p className="text-xs text-[#5a4b53] mt-1">{currentSession.email}</p>
                    
                    <span className={`inline-block mt-2.5 px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full border ${
                      currentSession.enrollment_status === 'accepted'
                        ? 'bg-emerald-50 text-[#2b704e] border-emerald-200' 
                        : currentSession.enrollment_status === 'declined'
                        ? 'bg-red-50 text-red-650 border-red-200'
                        : 'bg-amber-50 text-amber-600 border-amber-200'
                    }`}>
                      {currentSession.enrollment_status === 'accepted' ? 'Admitted & Enrolled' :
                       currentSession.enrollment_status === 'declined' ? 'Enrollment Declined' : 'Admission Pending Review'}
                    </span>
                  </div>

                  <div className="bg-[#f6f0ea]/50 border border-[#501537]/10 p-5 rounded-xl text-xs space-y-4 text-left font-medium text-[#5a4b53]">
                    <h4 className="font-bold text-[#c5a059] text-[10px] uppercase tracking-widest border-b border-[#501537]/10 pb-1.5 mb-2.5 font-sans">Academic & Profile Details</h4>
                    
                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div>
                        <span className="block text-gray-400 font-bold text-[9px] mb-0.5 uppercase">Student Name</span>
                        <span className="text-[#501537] font-bold">{currentSession.full_name}</span>
                      </div>
                      <div>
                        <span className="block text-gray-400 font-bold text-[9px] mb-0.5 uppercase">Father Name</span>
                        <span className="text-[#501537] font-semibold">{currentSession.father_name}</span>
                      </div>
                      <div>
                        <span className="block text-gray-400 font-bold text-[9px] mb-0.5 uppercase font-sans">Date of Birth</span>
                        <span className="text-[#501537] font-semibold">{currentSession.dob || '—'}</span>
                      </div>
                      <div>
                        <span className="block text-gray-400 font-bold text-[9px] mb-0.5 uppercase font-sans">Gender</span>
                        <span className="text-[#501537] font-semibold">{currentSession.gender || 'Female'}</span>
                      </div>
                      <div>
                        <span className="block text-gray-400 font-bold text-[9px] mb-0.5 uppercase font-sans">Academic Qualification</span>
                        <span className="text-[#501537] font-semibold">{currentSession.qualification || '—'}</span>
                      </div>
                      <div>
                        <span className="block text-gray-400 font-bold text-[9px] mb-0.5 uppercase">Residence</span>
                        <span className="text-[#501537] font-semibold">{currentSession.residence}</span>
                      </div>
                      <div>
                        <span className="block text-gray-400 font-bold text-[9px] mb-0.5 uppercase">Contact Phone</span>
                        <span className="text-[#501537] font-semibold">{currentSession.phone}</span>
                      </div>
                      <div>
                        <span className="block text-gray-400 font-bold text-[9px] mb-0.5 uppercase">Enrolled Course</span>
                        <span className="text-[#501537] font-semibold block truncate" title={currentSession.enrolled_course}>
                          {currentSession.enrolled_course}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Real-time Enrollment Status Track */}
                  <div className="mt-4 p-4 rounded-xl border border-dashed border-[#501537]/10 text-left flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
                      <GraduationCap className="w-4 h-4 text-[#c5a059]" />
                      <span>Admission Enrollment Status</span>
                    </div>

                    {(!currentSession.enrollment_status || currentSession.enrollment_status === 'pending') && (
                      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-lg text-[11px] leading-relaxed">
                        <strong className="block text-amber-900 font-bold mb-1 uppercase text-xs">● Status: Pending Administrator Review</strong>
                        Your application is safe and successfully registered! The Komal Stitching Training Center administrator is currently reviewing your profile parameters (DOB, Gender, Qualification) and program slot availability. You can sign out and log back in at any time to monitor your approval status.
                      </div>
                    )}

                    {currentSession.enrollment_status === 'accepted' && (
                      <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3.5 rounded-lg text-[11px] leading-relaxed">
                        <strong className="block text-emerald-900 font-bold mb-1 uppercase text-xs">● Status: Approved / Accepted</strong>
                        Congratulations! Your enrollment request has been fully verified and **ACCEPTED** by our registrar and administrator. Welcome to the official program batch! Feel free to visit the campus center to initialize your physical class schedule and course material hand-outs.
                      </div>
                    )}

                    {currentSession.enrollment_status === 'declined' && (
                      <div className="bg-red-50 border border-red-150 text-red-800 p-3.5 rounded-lg text-[11px] leading-relaxed">
                        <strong className="block text-red-900 font-bold mb-1 uppercase text-xs">● Status: Not Approved / Declined</strong>
                        Sorry, your admission registration request was not accepted by our registrar for this batch. This might be due to incomplete educational credentials, slot limits, or details mismatch. Please verify your profile fields with the administrator or submit another request.
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button 
                      onClick={onStudentLogout}
                      className="flex-grow py-3 bg-red-50 hover:bg-red-100 border border-red-200 text-[#b03a2e] rounded-xl text-xs font-bold uppercase transition-colors"
                    >
                      Log Out Profile
                    </button>
                    <button 
                      onClick={() => setShowAuthModal(false)}
                      className="flex-grow py-3 bg-[#501537] text-white rounded-xl text-xs font-bold uppercase transition-transform"
                    >
                      Close view
                    </button>
                  </div>
                </div>
              ) : (
                // Login or Register Tab switch
                <div>
                  <div className="flex border-b border-[#501537]/10 mb-6">
                    <button 
                      onClick={() => { setAuthTab('login'); setAuthError(''); setAuthSuccess(''); }}
                      className={`flex-grow py-2.5 text-center font-serif text-lg font-bold uppercase transition-all ${authTab === 'login' ? 'text-[#501537] border-b-2 border-[#c5a059]' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      Student Login
                    </button>
                    <button 
                      onClick={() => { setAuthTab('register'); setAuthError(''); setAuthSuccess(''); }}
                      className={`flex-grow py-2.5 text-center font-serif text-lg font-bold uppercase transition-all ${authTab === 'register' ? 'text-[#501537] border-b-2 border-[#c5a059]' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      Register
                    </button>
                  </div>

                  {authError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-[#b03a2e]">
                      {authError}
                    </div>
                  )}

                  {authSuccess && (
                    <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-[#2b704e]">
                      {authSuccess}
                    </div>
                  )}

                  {authTab === 'login' ? (
                    <form onSubmit={handleStudentLoginSubmit} className="flex flex-col gap-4">
                      <p className="text-[11px] text-[#5a4b53] bg-[#c5a059]/10 p-2.5 rounded-lg font-semibold italic text-center">
                        * Input real registered student email or type: <strong className="text-[#501537]">test@student.com</strong> for mockup access.
                      </p>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-[#5a4b53] uppercase tracking-wider">Email Address *</label>
                        <input 
                          type="email" 
                          required
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="e.g. name@example.com"
                          className="px-4 py-2.5 border border-[#501537]/15 rounded-xl outline-none text-sm text-[#501537]"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-[#5a4b53] uppercase tracking-wider">Password *</label>
                        <input 
                          type="password" 
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="••••••••"
                          className="px-4 py-2.5 border border-[#501537]/15 rounded-xl outline-none text-sm text-[#501537]"
                        />
                      </div>

                      <button 
                        type="submit"
                        className="w-full mt-2 py-3 bg-[#501537] hover:bg-[#7c2658] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md"
                      >
                        Sign in Student Desk
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleStudentRegisterSubmit} className="flex flex-col gap-3 max-h-[440px] overflow-y-auto pr-1">
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-[#5a4b53] uppercase tracking-wider">Full Name *</label>
                          <input 
                            type="text" 
                            required
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                            placeholder="e.g. Priya Deshmukh"
                            className="px-3 py-2 border border-[#501537]/15 rounded-xl outline-none text-xs"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-[#5a4b53] uppercase tracking-wider">Father's Name *</label>
                          <input 
                            type="text" 
                            required
                            value={regFather}
                            onChange={(e) => setRegFather(e.target.value)}
                            placeholder="e.g. Rajesh Deshmukh"
                            className="px-3 py-2 border border-[#501537]/15 rounded-xl outline-none text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-[#5a4b53] uppercase tracking-wider">DOB *</label>
                          <input 
                            type="date" 
                            required
                            value={regDob}
                            onChange={(e) => setRegDob(e.target.value)}
                            className="px-2 py-2 border border-[#501537]/15 rounded-xl outline-none text-xs bg-white"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-[#5a4b53] uppercase tracking-wider">Gender *</label>
                          <select 
                            required
                            value={regGender}
                            onChange={(e) => setRegGender(e.target.value)}
                            className="px-2 py-2 border border-[#501537]/15 rounded-xl outline-none text-xs bg-white text-slate-700 font-medium"
                          >
                            <option value="Female">Female</option>
                            <option value="Male">Male</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-[#5a4b53] uppercase tracking-wider">Education *</label>
                          <input 
                            type="text" 
                            required
                            value={regQualification}
                            onChange={(e) => setRegQualification(e.target.value)}
                            placeholder="e.g. Matric / Graduate"
                            className="px-2 py-2 border border-[#501537]/15 rounded-xl outline-none text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-[#5a4b53] uppercase tracking-wider">Residence (City) *</label>
                          <input 
                            type="text" 
                            required
                            value={regResidence}
                            onChange={(e) => setRegResidence(e.target.value)}
                            placeholder="e.g. Pune, Maharashtra"
                            className="px-3 py-2 border border-[#501537]/15 rounded-xl outline-none text-xs"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-[#5a4b53] uppercase tracking-wider">Phone Number *</label>
                          <input 
                            type="tel" 
                            required
                            value={regPhone}
                            onChange={(e) => setRegPhone(e.target.value)}
                            placeholder="e.g. +91 9876543210"
                            className="px-3 py-2 border border-[#501537]/15 rounded-xl outline-none text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-[#5a4b53] uppercase tracking-wider">Academy Course *</label>
                        <select 
                          required
                          value={regCourse}
                          onChange={(e) => setRegCourse(e.target.value)}
                          className="px-3 py-2 border border-[#501537]/15 rounded-xl outline-none text-xs text-[#501537] font-medium bg-white"
                        >
                          <option value="" disabled>-- Select Academy Program --</option>
                          <option value="Boutique Tailoring & Stitching Course">Boutique Tailoring & Stitching Course</option>
                          <option value="Advanced Fashion Designing Course">Advanced Fashion Designing Course</option>
                          <option value="Hand Embroidery & Zardozi Course">Hand Embroidery & Zardozi Course</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-[#5a4b53] uppercase tracking-wider">Email Address *</label>
                          <input 
                            type="email" 
                            required
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            placeholder="name@example.com"
                            className="px-3 py-2 border border-[#501537]/15 rounded-xl outline-none text-xs"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-[#5a4b53] uppercase tracking-wider">Password *</label>
                          <input 
                            type="password" 
                            required
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            placeholder="min. 6 chars"
                            className="px-3 py-2 border border-[#501537]/15 rounded-xl outline-none text-xs"
                          />
                        </div>
                      </div>

                      <button 
                        type="submit"
                        className="w-full mt-3 py-3 bg-[#501537] hover:bg-[#7c2658] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md"
                      >
                        Submit Student Enrollment
                      </button>
                    </form>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- SCANNED CERTIFICATE DETAIL MODAL --- */}
      <AnimatePresence>
        {showCertificateModal && verifiedCertificate && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl overflow-hidden shadow-2xl max-w-lg w-full relative my-auto md:my-8"
            >
              <button 
                onClick={() => setShowCertificateModal(false)}
                className="absolute top-4 right-4 text-[#1a0f15] bg-white/80 hover:bg-white rounded-full p-1.5 z-15 shadow-sm border border-gray-200"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-6">
                <h3 className="font-serif font-bold text-xl text-[#501537] mb-1">Physical Certificate Scan</h3>
                <p className="text-[10px] text-gray-500 mb-4 font-mono">Roll: {verifiedCertificate.roll_number} | Ledger Log Matches</p>

                <div className="w-full h-[320px] rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                  <img 
                    src={verifiedCertificate.certificate_image_url} 
                    alt="Scanned Degree" 
                    className="w-full h-full object-contain"
                  />
                </div>

                <p className="text-center text-xs text-[#5a4b53] mt-4 italic leading-normal">
                  "This electronic ledger scanner matches the official physical paper transcript issued during graduation."
                </p>

                <button 
                  onClick={() => setShowCertificateModal(false)}
                  className="w-full mt-6 py-2.5 bg-[#501537] text-white rounded-lg text-xs font-bold uppercase hover:bg-[#7c2658]"
                >
                  Close Scan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
