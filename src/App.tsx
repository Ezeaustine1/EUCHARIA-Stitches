/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import {
  auth,
  db,
  BOOTSTRAPPED_ADMIN_EMAIL,
  compressImageFile,
} from './lib/firebase.ts';
import {
  BRAND_IMAGES,
  CollectionItem,
  ServiceItem,
  GalleryPhoto,
  OrderEnquiry,
  ContactMessage,
  Testimonial,
  SiteSettings,
  COLLECTION_CATEGORIES,
  HOMEPAGE_FEATURED_CATEGORIES,
  DEFAULT_COLLECTIONS,
  DEFAULT_SERVICES,
  DEFAULT_GALLERY,
  SAMPLE_TESTIMONIALS,
  DEFAULT_SETTINGS,
  FAQ_ITEMS,
  FASHION_INSPIRATION_NOTES,
  getWhatsAppLink,
} from './data/initialData.ts';
import {
  downloadOrderEnquiryPdf,
  buildProfessionalEmails,
  EmailDispatchResult,
} from './utils/pdfGenerator.ts';
import { ResilientImage } from './components/ResilientImage.tsx';
import { StudioMap } from './components/StudioMap.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { FabricLibrary } from './components/FabricLibrary.tsx';
import { LiveChatWidget } from './components/LiveChatWidget.tsx';
import {
  Menu,
  X,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Upload,
  CheckCircle2,
  Maximize2,
  Star,
  Instagram,
  Facebook,
  Lock,
  Search,
  FileDown,
  Mail,
  Sparkles,
} from 'lucide-react';

export type PageRoute =
  | 'home'
  | 'about'
  | 'collections'
  | 'services'
  | 'booking'
  | 'gallery'
  | 'contact'
  | 'admin'
  | 'privacy'
  | 'terms'
  | 'not-found';

const LOCAL_STORE_KEY = 'eucharia_stitches_store_v2';

export default function App() {
  const [activePage, setActivePage] = useState<PageRoute>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState(false);

  // Auth & Persistent Store State
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [collections, setCollections] = useState<CollectionItem[]>(DEFAULT_COLLECTIONS);
  const [services, setServices] = useState<ServiceItem[]>(DEFAULT_SERVICES);
  const [gallery, setGallery] = useState<GalleryPhoto[]>(DEFAULT_GALLERY);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(SAMPLE_TESTIMONIALS);
  const [enquiries, setEnquiries] = useState<OrderEnquiry[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [subscribersCount, setSubscribersCount] = useState<number>(0);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  // Collections & Gallery Filtering State
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [galleryCategory, setGalleryCategory] = useState<string>('All Categories');
  const [lightboxPhoto, setLightboxPhoto] = useState<GalleryPhoto | null>(null);

  // Featured Carousel Index
  const [carouselIndex, setCarouselIndex] = useState(0);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Booking / Order Enquiry Form State
  const [bookingForm, setBookingForm] = useState({
    fullName: '',
    phone: '',
    whatsapp: '',
    email: '',
    outfitType: '',
    category: 'Aso-Ebi',
    occasion: 'Wedding / Aso-Ebi',
    preferredFabric: '',
    preferredColor: '',
    appointmentDate: '',
    deliveryDate: '',
    instructions: '',
    inspirationImage: '',
  });
  const [bookingUploading, setBookingUploading] = useState(false);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [completedBooking, setCompletedBooking] = useState<{
    enquiry: OrderEnquiry;
    emailResult: EmailDispatchResult;
  } | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [showEmailPreviewTab, setShowEmailPreviewTab] = useState<'client' | 'admin'>('client');

  // Customer Testimonial Submission Form
  const [reviewForm, setReviewForm] = useState({
    customerName: '',
    roleOrOccasion: '',
    review: '',
    rating: 5,
    photoUrl: '',
  });
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Contact Us Form
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    email: '',
    subject: '',
    message: '',
  });
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  // Newsletter Subscription Form
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

  // Load & Sync State from LocalStorage and Server Store (/api/store)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.collections?.length) setCollections(parsed.collections);
        if (parsed.services?.length) setServices(parsed.services);
        if (parsed.gallery?.length) setGallery(parsed.gallery);
        if (parsed.testimonials?.length) setTestimonials(parsed.testimonials);
        if (parsed.enquiries) setEnquiries(parsed.enquiries);
        if (parsed.contactMessages) setContactMessages(parsed.contactMessages);
        if (parsed.settings) setSettings(parsed.settings);
        if (typeof parsed.subscribersCount === 'number') setSubscribersCount(parsed.subscribersCount);
      }
    } catch {
      // Ignore corrupt localStorage
    }

    fetch('/api/store')
      .then((r) => (r.ok ? r.json() : null))
      .then((serverData) => {
        if (!serverData) return;
        if (serverData.enquiries?.length) {
          setEnquiries((prev) => {
            const merged = [...serverData.enquiries];
            prev.forEach((p) => {
              if (!merged.some((m) => m.id === p.id)) merged.push(p);
            });
            return merged;
          });
        }
        if (serverData.collections?.length) setCollections(serverData.collections);
        if (serverData.services?.length) setServices(serverData.services);
        if (serverData.gallery?.length) setGallery(serverData.gallery);
        if (serverData.testimonials?.length) setTestimonials(serverData.testimonials);
        if (serverData.contactMessages?.length) setContactMessages(serverData.contactMessages);
        if (serverData.settings) setSettings(serverData.settings);
      })
      .catch(() => {
        // Static deployment (Netlify / GitHub Pages) works cleanly via localStorage
      });
  }, []);

  const persistStudioState = (partial: Record<string, any>) => {
    try {
      const currentRaw = localStorage.getItem(LOCAL_STORE_KEY);
      const current = currentRaw ? JSON.parse(currentRaw) : {};
      const next = {
        collections,
        services,
        gallery,
        testimonials,
        enquiries,
        contactMessages,
        settings,
        subscribersCount,
        ...current,
        ...partial,
      };
      localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify(next));
      fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partial),
      }).catch(() => {});
    } catch {
      // Ignore storage quota warning
    }
  };

  // Listen to Google Maps Platform Quota Event
  useEffect(() => {
    const handleQuota = () => setGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  // Listen to Firebase Auth State
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Optional Firestore Live Sync
  useEffect(() => {
    if (!authReady) return;

    const unsubCollections = onSnapshot(
      collection(db, 'collections'),
      (snap) => {
        if (!snap.empty) {
          const items: CollectionItem[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<CollectionItem, 'id'>),
          }));
          setCollections(items);
        }
      },
      () => {}
    );

    const unsubServices = onSnapshot(
      collection(db, 'services'),
      (snap) => {
        if (!snap.empty) {
          const items: ServiceItem[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ServiceItem, 'id'>),
          }));
          setServices(items);
        }
      },
      () => {}
    );

    const unsubGallery = onSnapshot(
      collection(db, 'gallery'),
      (snap) => {
        if (!snap.empty) {
          const items: GalleryPhoto[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<GalleryPhoto, 'id'>),
          }));
          setGallery(items);
        }
      },
      () => {}
    );

    const unsubTestimonials = onSnapshot(
      query(collection(db, 'testimonials'), where('approved', '==', true)),
      (snap) => {
        if (!snap.empty) {
          const items: Testimonial[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Testimonial, 'id'>),
          }));
          setTestimonials((prev) => {
            const unapproved = prev.filter((p) => !p.approved);
            return [...items, ...unapproved];
          });
        }
      },
      () => {}
    );

    const unsubSettings = onSnapshot(
      doc(db, 'settings', 'global'),
      (docSnap) => {
        if (docSnap.exists()) {
          setSettings(docSnap.data() as SiteSettings);
        }
      },
      () => {}
    );

    return () => {
      unsubCollections();
      unsubServices();
      unsubGallery();
      unsubTestimonials();
      unsubSettings();
    };
  }, [authReady]);

  // Dynamic Document Title per Page
  useEffect(() => {
    const titles: Record<PageRoute, string> = {
      home: 'EUCHARIA Stitches – Elegance in Every Stitch | Ado Ekiti, Nigeria',
      about: 'About Us – EUCHARIA Stitches Luxury Fashion Studio',
      collections: 'Our Collections & Fabric Library – EUCHARIA Stitches',
      services: 'Our Tailoring & Couture Services – EUCHARIA Stitches',
      booking: 'Book an Appointment or Order – EUCHARIA Stitches',
      gallery: 'Portfolio Gallery & Client Reviews – EUCHARIA Stitches',
      contact: 'Contact Us – EUCHARIA Stitches | Olorunsogo, Ado Ekiti',
      admin: 'Administrator Dashboard – EUCHARIA Stitches',
      privacy: 'Privacy Policy – EUCHARIA Stitches',
      terms: 'Terms and Conditions – EUCHARIA Stitches',
      'not-found': 'Page Not Found – EUCHARIA Stitches',
    };
    document.title = titles[activePage] || titles.home;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activePage]);

  const navigateTo = (page: PageRoute, categoryFilter?: string) => {
    if (categoryFilter) {
      setSelectedCategory(categoryFilter);
    }
    setActivePage(page);
    setMobileMenuOpen(false);
  };

  const handleBookSpecificDesign = (
    outfitTitle: string,
    category: string,
    fabricName?: string
  ) => {
    setBookingForm((prev) => ({
      ...prev,
      outfitType: outfitTitle,
      category: category,
      preferredFabric: fabricName || prev.preferredFabric,
    }));
    setCompletedBooking(null);
    navigateTo('booking');
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);

    if (
      bookingForm.fullName.trim().length < 2 ||
      bookingForm.phone.trim().length < 5 ||
      bookingForm.whatsapp.trim().length < 5 ||
      bookingForm.outfitType.trim().length < 2 ||
      bookingForm.preferredColor.trim().length < 1 ||
      !bookingForm.appointmentDate ||
      !bookingForm.deliveryDate
    ) {
      setBookingError('Please fill in all required booking fields before submitting.');
      return;
    }

    setBookingSubmitting(true);
    const enquiryId = `enq-${Date.now()}`;
    const payload = {
      fullName: bookingForm.fullName.trim().slice(0, 120),
      phone: bookingForm.phone.trim().slice(0, 40),
      whatsapp: bookingForm.whatsapp.trim().slice(0, 40),
      email: bookingForm.email.trim().slice(0, 120),
      outfitType: bookingForm.outfitType.trim().slice(0, 150),
      category: bookingForm.category.trim().slice(0, 80),
      occasion: bookingForm.occasion.trim().slice(0, 100),
      preferredFabric: bookingForm.preferredFabric.trim().slice(0, 150),
      preferredColor: bookingForm.preferredColor.trim().slice(0, 100),
      appointmentDate: bookingForm.appointmentDate.trim().slice(0, 40),
      deliveryDate: bookingForm.deliveryDate.trim().slice(0, 40),
      instructions: bookingForm.instructions.trim().slice(0, 2000),
      inspirationImage: bookingForm.inspirationImage.slice(0, 800000),
      status: 'New' as const,
      createdAt: new Date().toISOString(),
    };

    const newEnquiry: OrderEnquiry = {
      id: enquiryId,
      ...payload,
    };

    const updatedEnquiries = [newEnquiry, ...enquiries];
    setEnquiries(updatedEnquiries);
    persistStudioState({ enquiries: updatedEnquiries });

    // Build professional Client & Admin emails immediately
    const generatedEmails = buildProfessionalEmails(newEnquiry, settings);

    try {
      // Save to Firestore
      setDoc(doc(db, 'enquiries', enquiryId), payload).catch(() => {});

      // Dispatch email notification to backend API
      const notifyResp = await fetch('/api/enquiries/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enquiry: newEnquiry,
          adminEmail: BOOTSTRAPPED_ADMIN_EMAIL,
        }),
      }).catch(() => null);

      if (notifyResp && notifyResp.ok) {
        const notifyJson = await notifyResp.json();
        generatedEmails.smtpSent = Boolean(notifyJson.smtpSent);
      }

      setCompletedBooking({
        enquiry: newEnquiry,
        emailResult: generatedEmails,
      });

      setBookingForm({
        fullName: '',
        phone: '',
        whatsapp: '',
        email: '',
        outfitType: '',
        category: 'Aso-Ebi',
        occasion: 'Wedding / Aso-Ebi',
        preferredFabric: '',
        preferredColor: '',
        appointmentDate: '',
        deliveryDate: '',
        instructions: '',
        inspirationImage: '',
      });
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError(null);
    if (
      reviewForm.customerName.trim().length < 2 ||
      reviewForm.roleOrOccasion.trim().length < 2 ||
      reviewForm.review.trim().length < 10
    ) {
      setReviewError('Please enter your name, occasion, and a review of at least 10 characters.');
      return;
    }
    const reviewId = `rev-${Date.now()}`;
    const payload = {
      customerName: reviewForm.customerName.trim().slice(0, 100),
      roleOrOccasion: reviewForm.roleOrOccasion.trim().slice(0, 100),
      review: reviewForm.review.trim().slice(0, 1000),
      rating: Number(reviewForm.rating) || 5,
      photoUrl: reviewForm.photoUrl.slice(0, 800000),
      approved: false,
      isSample: false,
      createdAt: new Date().toISOString(),
    };

    const newReview: Testimonial = { id: reviewId, ...payload };
    const updated = [newReview, ...testimonials];
    setTestimonials(updated);
    persistStudioState({ testimonials: updated });

    setDoc(doc(db, 'testimonials', reviewId), payload).catch(() => {});

    setReviewSubmitted(true);
    setReviewForm({
      customerName: '',
      roleOrOccasion: '',
      review: '',
      rating: 5,
      photoUrl: '',
    });
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError(null);
    if (
      contactForm.name.trim().length < 2 ||
      contactForm.phone.trim().length < 5 ||
      contactForm.subject.trim().length < 2 ||
      contactForm.message.trim().length < 5
    ) {
      setContactError('Please complete your name, phone number, subject, and message.');
      return;
    }
    const msgId = `msg-${Date.now()}`;
    const payload = {
      name: contactForm.name.trim().slice(0, 120),
      phone: contactForm.phone.trim().slice(0, 40),
      email: contactForm.email.trim().slice(0, 120),
      subject: contactForm.subject.trim().slice(0, 150),
      message: contactForm.message.trim().slice(0, 2000),
      status: 'Unread' as const,
      createdAt: new Date().toISOString(),
    };

    const newMsg: ContactMessage = { id: msgId, ...payload };
    const updated = [newMsg, ...contactMessages];
    setContactMessages(updated);
    persistStudioState({ contactMessages: updated });

    setDoc(doc(db, 'contactMessages', msgId), payload).catch(() => {});

    setContactSubmitted(true);
    setContactForm({
      name: '',
      phone: '',
      email: '',
      subject: '',
      message: '',
    });
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.includes('@') || newsletterEmail.trim().length < 5) return;
    const subId = `sub-${Date.now()}`;
    const nextCount = subscribersCount + 1;
    setSubscribersCount(nextCount);
    persistStudioState({ subscribersCount: nextCount });
    setDoc(doc(db, 'newsletterSubscribers', subId), {
      email: newsletterEmail.trim().slice(0, 120),
      createdAt: new Date().toISOString(),
    }).catch(() => {});
    setNewsletterSuccess(true);
    setNewsletterEmail('');
  };

  const filteredCollections = collections.filter((item) => {
    const matchesCategory =
      selectedCategory === 'All Categories' || item.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredGallery = gallery.filter(
    (g) => galleryCategory === 'All Categories' || g.category === galleryCategory
  );

  const publishedTestimonials = testimonials.filter((t) => t.approved);

  const featuredCarouselItems = collections.filter((c) => c.featured);
  const currentCarouselItem =
    featuredCarouselItems[carouselIndex % Math.max(1, featuredCarouselItems.length)] ||
    collections[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#1A1412]">
      {/* GMP Quota Banner */}
      {gmpQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* TOP NAVIGATION BAR (Strict 3-Zone Contract) */}
      <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E6DEC8]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 py-3.5">
          {/* Zone 1: Single Text Element Brand Wordmark */}
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('home');
            }}
            className="font-serif-display text-xl md:text-2xl font-bold tracking-tight text-[#1A1412] whitespace-nowrap shrink-0"
          >
            ES · EUCHARIA Stitches
          </a>

          {/* Zone 2: Concise Single-Line Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#5C4E47]">
            {[
              { id: 'home', label: 'Home' },
              { id: 'about', label: 'About Us' },
              { id: 'collections', label: 'Collections' },
              { id: 'services', label: 'Services' },
              { id: 'gallery', label: 'Gallery' },
              { id: 'contact', label: 'Contact' },
            ].map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo(item.id as PageRoute);
                }}
                className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                  activePage === item.id
                    ? 'text-[#1A1412] border-[#C5A059] font-semibold'
                    : 'border-transparent hover:text-[#1A1412] hover:border-[#C5A059]/50'
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Zone 3: 1 Primary Action Button (+ Mobile Menu Toggle) */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigateTo('booking')}
              className="px-5 py-2.5 text-xs font-semibold text-[#FAF7F2] bg-[#1A1412] rounded-lg hover:bg-[#2C211D] transition-colors whitespace-nowrap shrink-0"
            >
              Book an Appointment
            </button>
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="lg:hidden p-2 text-[#1A1412] hover:bg-[#F5EFE6] rounded-lg transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Responsive Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#FAF7F2] border-t border-[#E6DEC8] px-6 py-4 space-y-2.5">
            {[
              { id: 'home', label: 'Home' },
              { id: 'about', label: 'About Us' },
              { id: 'collections', label: 'Our Collections & Fabric Library' },
              { id: 'services', label: 'Our Services' },
              { id: 'gallery', label: 'Gallery & Testimonials' },
              { id: 'booking', label: 'Book an Appointment' },
              { id: 'contact', label: 'Contact Us' },
              { id: 'admin', label: 'Admin Dashboard (Password Login)' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id as PageRoute)}
                className={`block w-full text-left py-1.5 text-sm font-medium ${
                  activePage === item.id
                    ? 'text-[#9E7B36] font-semibold'
                    : 'text-[#1A1412]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* MAIN CONTENT VIEWPORT */}
      <main className="flex-1">
        {/* ==================== A. HOME PAGE ==================== */}
        {activePage === 'home' && (
          <div>
            {/* Compact Split-Screen Editorial Hero Section */}
            <section className="max-w-7xl mx-auto px-6 py-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                {/* Left Column: Typographic Hierarchy */}
                <div className="lg:col-span-6 flex flex-col justify-center space-y-5">
                  <div className="flex items-center gap-2 text-xs text-[#9E7B36] font-medium">
                    <span>EUCHARIA Stitches Couture</span>
                    <span aria-hidden="true">·</span>
                    <span>Ado Ekiti, Nigeria</span>
                    <span aria-hidden="true">·</span>
                    <button
                      onClick={() => navigateTo('admin')}
                      className="underline hover:text-[#1A1412]"
                    >
                      Admin Login
                    </button>
                  </div>

                  <h1
                    className="font-serif-display text-4xl sm:text-5xl lg:text-[54px] font-semibold text-[#1A1412] leading-[1.08] tracking-tight"
                    style={{ textWrap: 'balance' }}
                  >
                    {settings.heroHeadline}
                  </h1>

                  <p className="text-sm sm:text-base text-[#5C4E47] leading-relaxed max-w-xl">
                    {settings.heroSubtext}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      onClick={() => navigateTo('collections')}
                      className="inline-flex items-center gap-2 px-5 py-3 bg-[#1A1412] text-[#FAF7F2] text-xs font-semibold rounded-lg hover:bg-[#2C211D] transition-colors whitespace-nowrap shrink-0"
                    >
                      Explore Our Collections
                      <ArrowRight className="w-4 h-4 text-[#C5A059]" />
                    </button>
                    <button
                      onClick={() => navigateTo('booking')}
                      className="inline-flex items-center gap-2 px-5 py-3 border border-[#1A1412] text-[#1A1412] bg-transparent hover:bg-[#1A1412] hover:text-[#FAF7F2] text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0"
                    >
                      Book Your Outfit
                    </button>
                  </div>

                  <div className="pt-3 border-t border-[#E6DEC8] flex flex-wrap items-center gap-3 text-xs text-[#5C4E47]">
                    <span>Bespoke Tailoring</span>
                    <span aria-hidden="true">·</span>
                    <span>Aso-Ebi & Bridal Couture</span>
                    <span aria-hidden="true">·</span>
                    <span>Fabric Library & Care Guide</span>
                  </div>
                </div>

                {/* Right Column: High-Fashion Nigerian Editorial Portrait */}
                <div className="lg:col-span-6 relative rounded-2xl overflow-hidden border border-[#E6DEC8] min-h-[340px] lg:min-h-[420px]">
                  <ResilientImage
                    src={BRAND_IMAGES.heroCouture}
                    alt="Nigerian female model wearing champagne gold and ivory bespoke Aso-Ebi couture gown by EUCHARIA Stitches"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex flex-col justify-end p-6">
                    <p className="text-xs text-[#E6DEC8]">
                      Signature Lookbook · Bespoke Lace & Silk
                    </p>
                    <p className="font-serif-display text-2xl text-white font-medium mt-0.5">
                      The Royal Champagne Aso-Ebi Silhouette
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Welcome to EUCHARIA Stitches + Featured Outfit Carousel */}
            <section className="bg-[#F5EFE6] border-y border-[#E6DEC8] py-10">
              <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-3.5">
                  <p className="text-xs text-[#9E7B36] font-medium">
                    Our Fashion House · Road 1, Zone 8, Olorunsogo, Ado Ekiti
                  </p>
                  <h2
                    className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#1A1412]"
                    style={{ textWrap: 'balance' }}
                  >
                    Welcome to EUCHARIA Stitches
                  </h2>
                  <p className="text-sm text-[#5C4E47] leading-relaxed">
                    EUCHARIA Stitches is a professional fashion design studio dedicated to creating
                    beautiful, well-fitted, and carefully crafted outfits for life’s most meaningful
                    occasions. Whether you are preparing for a traditional engagement, selecting
                    Aso-Ebi for a family wedding, refreshing your corporate wardrobe, or
                    commissioning a bespoke bridal reception gown, every stitch is executed with
                    precision and elegance.
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      onClick={() => navigateTo('about')}
                      className="px-4 py-2.5 bg-[#1A1412] text-[#FAF7F2] text-xs font-medium rounded-lg hover:bg-[#2C211D] transition-colors whitespace-nowrap shrink-0"
                    >
                      Read Our Brand Story
                    </button>
                    <a
                      href={getWhatsAppLink(undefined, settings.whatsappNumber)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#1A1412]/30 text-[#1A1412] text-xs font-medium rounded-lg hover:bg-white transition-colors whitespace-nowrap shrink-0"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-[#9E7B36]" />
                      WhatsApp ({settings.whatsappNumber})
                    </a>
                  </div>
                </div>

                {/* Featured Outfit Spotlight Carousel */}
                {currentCarouselItem && (
                  <div className="lg:col-span-6 bg-white border border-[#E6DEC8] rounded-xl overflow-hidden">
                    <div className="grid grid-cols-1 sm:grid-cols-12 items-stretch">
                      <div className="sm:col-span-5 h-56 sm:h-auto overflow-hidden">
                        <ResilientImage
                          src={currentCarouselItem.imageUrl}
                          alt={currentCarouselItem.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="sm:col-span-7 p-5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 text-xs text-[#9E7B36]">
                            <span>Featured Spotlight</span>
                            <span aria-hidden="true">·</span>
                            <span>{currentCarouselItem.category}</span>
                          </div>
                          <h3 className="font-serif-display text-xl font-semibold text-[#1A1412] mt-1">
                            {currentCarouselItem.title}
                          </h3>
                          <p className="text-xs font-mono-num text-[#1A1412] mt-0.5">
                            {currentCarouselItem.priceEstimate}
                          </p>
                          <p className="text-xs text-[#5C4E47] mt-2 line-clamp-2 leading-relaxed">
                            {currentCarouselItem.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#E6DEC8] flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleBookSpecificDesign(
                                currentCarouselItem.title,
                                currentCarouselItem.category
                              )
                            }
                            className="flex-1 px-3.5 py-2 bg-[#1A1412] text-[#FAF7F2] text-xs font-medium rounded-lg hover:bg-[#2C211D] transition-colors whitespace-nowrap shrink-0"
                          >
                            Book This Outfit
                          </button>
                          <button
                            onClick={() =>
                              setCarouselIndex((prev) =>
                                prev === 0 ? featuredCarouselItems.length - 1 : prev - 1
                              )
                            }
                            className="p-2 border border-[#E6DEC8] rounded-lg hover:bg-[#FAF7F2]"
                            aria-label="Previous Featured Outfit"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              setCarouselIndex(
                                (prev) => (prev + 1) % featuredCarouselItems.length
                              )
                            }
                            className="p-2 border border-[#E6DEC8] rounded-lg hover:bg-[#FAF7F2]"
                            aria-label="Next Featured Outfit"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Featured Collections (5-in-a-Row Compact Professional Grid) */}
            <section className="max-w-7xl mx-auto px-6 py-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-6">
                <div>
                  <p className="text-xs text-[#9E7B36] font-medium">
                    Curated Fashion Categories · 5-in-a-Row Lookbook
                  </p>
                  <h2 className="font-serif-display text-3xl font-semibold text-[#1A1412] mt-0.5">
                    Featured Collections
                  </h2>
                </div>
                <button
                  onClick={() => navigateTo('collections', 'All Categories')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1A1412] hover:text-[#9E7B36] transition-colors whitespace-nowrap shrink-0"
                >
                  Explore Full Lookbook & Fabric Library
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {HOMEPAGE_FEATURED_CATEGORIES.map((cat, idx) => (
                  <div
                    key={cat.id}
                    className="bg-white border border-[#E6DEC8] rounded-xl overflow-hidden flex flex-col justify-between group hover:-translate-y-0.5 transition-transform duration-200"
                  >
                    <div>
                      <div className="h-44 w-full overflow-hidden bg-[#F5EFE6]">
                        <ResilientImage
                          src={cat.imageUrl}
                          alt={cat.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-3.5">
                        <p className="text-[11px] text-[#9E7B36] font-mono-num">
                          0{idx + 1} · Category
                        </p>
                        <h3 className="font-serif-display text-base font-semibold text-[#1A1412] mt-0.5 line-clamp-1">
                          {cat.name}
                        </h3>
                        <p className="text-[11px] text-[#5C4E47] mt-1 line-clamp-2 leading-relaxed">
                          {cat.description}
                        </p>
                      </div>
                    </div>
                    <div className="px-3.5 pb-3.5 pt-1">
                      <button
                        onClick={() => navigateTo('collections', cat.mappedCategory)}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#FAF7F2] border border-[#E6DEC8] text-[#1A1412] group-hover:bg-[#1A1412] group-hover:text-[#FAF7F2] text-[11px] font-medium rounded-lg transition-colors whitespace-nowrap shrink-0"
                      >
                        Explore Collection
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Compact Fashion Inspiration + FAQ Section */}
            <section className="bg-[#1A1412] text-[#FAF7F2] py-12">
              <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left 5 Columns: Style Inspiration Notes */}
                <div className="lg:col-span-5 space-y-4">
                  <div>
                    <p className="text-xs text-[#C5A059] font-medium">
                      Style Direction & Fabric Care
                    </p>
                    <h2 className="font-serif-display text-2xl sm:text-3xl font-semibold text-white mt-0.5">
                      Fashion Inspiration Notes
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {FASHION_INSPIRATION_NOTES.map((note, idx) => (
                      <div
                        key={idx}
                        className="border border-white/10 rounded-xl p-3.5 bg-[#241C19] flex items-center gap-3.5"
                      >
                        <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                          <ResilientImage
                            src={note.image}
                            alt={note.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] text-[#C5A059]">{note.category}</p>
                          <h3 className="font-serif-display text-base font-semibold text-white truncate">
                            {note.title}
                          </h3>
                          <p className="text-[11px] text-[#D6CEC2] line-clamp-2 mt-0.5">
                            {note.excerpt}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right 7 Columns: Frequently Asked Questions */}
                <div className="lg:col-span-7 space-y-3">
                  <div>
                    <p className="text-xs text-[#C5A059] font-medium">
                      Client Guidance
                    </p>
                    <h2 className="font-serif-display text-2xl sm:text-3xl font-semibold text-white mt-0.5">
                      Frequently Asked Questions
                    </h2>
                  </div>
                  <div className="space-y-2.5 pt-1">
                    {FAQ_ITEMS.map((faq, idx) => {
                      const isOpen = openFaqIndex === idx;
                      return (
                        <div
                          key={idx}
                          className="border border-white/15 rounded-xl bg-[#241C19] overflow-hidden"
                        >
                          <button
                            onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                            className="w-full flex items-center justify-between gap-4 px-4 py-3 text-left text-xs sm:text-sm font-medium text-white hover:text-[#C5A059] transition-colors"
                          >
                            <span>{faq.question}</span>
                            <ChevronDown
                              className={`w-4 h-4 text-[#C5A059] shrink-0 transition-transform ${
                                isOpen ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                          {isOpen && (
                            <div className="px-4 pb-3.5 text-xs text-[#D6CEC2] leading-relaxed border-t border-white/10 pt-2.5">
                              {faq.answer}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ==================== B. ABOUT US PAGE ==================== */}
        {activePage === 'about' && (
          <section className="max-w-7xl mx-auto px-6 py-12 space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-6 space-y-4">
                <div className="flex items-center gap-2 text-xs text-[#9E7B36] font-medium">
                  <span>About EUCHARIA Stitches</span>
                  <span aria-hidden="true">·</span>
                  <span>Ado Ekiti, Ekiti State</span>
                </div>
                <h1
                  className="font-serif-display text-4xl sm:text-5xl font-semibold text-[#1A1412]"
                  style={{ textWrap: 'balance' }}
                >
                  Where Creativity Meets Dedicated Craftsmanship.
                </h1>
                <p className="text-sm sm:text-base text-[#5C4E47] leading-relaxed">
                  <strong>EUCHARIA Stitches</strong> is a Nigerian fashion design, tailoring, and
                  custom clothing studio located at Road 1, Zone 8, Olorunsogo, Ado Ekiti, Ekiti
                  State. We exist to help women and families express their personal elegance through
                  thoughtfully designed, well-fitted garments.
                </p>
                <p className="text-sm sm:text-base text-[#5C4E47] leading-relaxed">
                  Our philosophy is simple: every customer deserves an outfit that honors their
                  silhouette, complements their occasion, and reflects refined craftsmanship from
                  the first sketch to the final pressing.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => navigateTo('booking')}
                    className="px-5 py-2.5 bg-[#1A1412] text-[#FAF7F2] text-xs font-semibold rounded-lg hover:bg-[#2C211D] transition-colors whitespace-nowrap shrink-0"
                  >
                    Book an Appointment
                  </button>
                  <button
                    onClick={() => navigateTo('collections')}
                    className="px-5 py-2.5 border border-[#1A1412] text-[#1A1412] text-xs font-semibold rounded-lg hover:bg-[#F5EFE6] transition-colors whitespace-nowrap shrink-0"
                  >
                    Explore Collections & Fabric Library
                  </button>
                </div>
              </div>

              <div className="lg:col-span-6 rounded-2xl overflow-hidden border border-[#E6DEC8]">
                <ResilientImage
                  src={BRAND_IMAGES.atelierStudio}
                  alt="Fashion designer at EUCHARIA Stitches working on a champagne gold lace garment in the studio"
                  className="w-full h-[380px] object-cover"
                />
              </div>
            </div>

            {/* Core Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-[#E6DEC8]">
              <div className="bg-white p-6 rounded-xl border border-[#E6DEC8]">
                <p className="text-xs text-[#9E7B36] font-medium">01. Brand Philosophy</p>
                <h3 className="font-serif-display text-2xl font-semibold text-[#1A1412] mt-1.5">
                  Passion for Fashion & Individuality
                </h3>
                <p className="text-xs sm:text-sm text-[#5C4E47] mt-2 leading-relaxed">
                  We believe clothing should never feel generic. Whether working with vibrant
                  Ankara wax prints, delicate French lace, Aso-Oke, or structured suiting crepe, we
                  tailor each design to highlight our client’s natural poise and personal taste.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-[#E6DEC8]">
                <p className="text-xs text-[#9E7B36] font-medium">02. Quality & Finishing</p>
                <h3 className="font-serif-display text-2xl font-semibold text-[#1A1412] mt-1.5">
                  Attention to Detail & Proper Finishing
                </h3>
                <p className="text-xs sm:text-sm text-[#5C4E47] mt-2 leading-relaxed">
                  True quality lives in the details—accurate measurement taking, balanced dart
                  placement, neat internal seams, secure beadwork, smooth zipper installation, and
                  crisp garment pressing before collection.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-[#E6DEC8]">
                <p className="text-xs text-[#9E7B36] font-medium">03. Client Dedication</p>
                <h3 className="font-serif-display text-2xl font-semibold text-[#1A1412] mt-1.5">
                  Confidence & Customer Satisfaction
                </h3>
                <p className="text-xs sm:text-sm text-[#5C4E47] mt-2 leading-relaxed">
                  From your initial style consultation and fabric assessment to your fitting
                  appointment at our Olorunsogo studio, we communicate clearly and work diligently
                  so you step out feeling confident and radiant.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ==================== C. OUR COLLECTIONS PAGE + FABRIC LIBRARY ==================== */}
        {activePage === 'collections' && (
          <section className="max-w-7xl mx-auto px-6 py-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E6DEC8]">
              <div>
                <p className="text-xs text-[#9E7B36] font-medium">
                  EUCHARIA Stitches Lookbook · 5-in-a-Row Gallery
                </p>
                <h1 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#1A1412] mt-0.5">
                  Our Fashion Collections & Fabric Library
                </h1>
                <p className="text-xs sm:text-sm text-[#5C4E47] mt-1 max-w-2xl">
                  Browse our bespoke Nigerian fashion designs across all 11 categories, or scroll
                  down to explore our interactive <strong>Fabric Library</strong> for textile care,
                  usage, and style suitability guides.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <a
                  href="#fabric-library"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#F5EFE6] border border-[#C5A059] rounded-lg text-xs font-semibold text-[#1A1412] hover:bg-[#E6DEC8]/60 transition-colors whitespace-nowrap shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#9E7B36]" />
                  Jump to Fabric Library
                </a>
                <div className="relative w-full sm:w-60">
                  <Search className="w-3.5 h-3.5 text-[#5C4E47] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search outfits or fabrics..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E6DEC8] rounded-lg text-[#1A1412] focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>
            </div>

            {/* Interactive Category Filter Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-3 my-1">
              {COLLECTION_CATEGORIES.map((category) => {
                const active = selectedCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-[#1A1412] text-[#FAF7F2]'
                        : 'bg-white border border-[#E6DEC8] text-[#5C4E47] hover:text-[#1A1412]'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>

            {/* 5-in-a-Row Collections Grid */}
            {filteredCollections.length === 0 ? (
              <div className="bg-white border border-[#E6DEC8] rounded-xl p-10 text-center my-6">
                <p className="font-serif-display text-2xl text-[#1A1412]">
                  No designs match your current filter
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('All Categories');
                    setSearchQuery('');
                  }}
                  className="mt-4 px-5 py-2 bg-[#1A1412] text-[#FAF7F2] text-xs font-medium rounded-lg"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-4">
                {filteredCollections.map((item) => {
                  const whatsappEnquiryUrl = getWhatsAppLink(
                    `Hello EUCHARIA Stitches, I visited your website and I am interested in the "${item.title}" under the ${item.category} collection (${item.priceEstimate}). Please provide more information.`,
                    settings.whatsappNumber
                  );
                  return (
                    <article
                      key={item.id}
                      className="bg-white border border-[#E6DEC8] rounded-xl overflow-hidden flex flex-col justify-between group hover:-translate-y-0.5 transition-transform duration-200"
                    >
                      <div>
                        <div className="h-48 w-full overflow-hidden bg-[#F5EFE6]">
                          <ResilientImage
                            src={item.imageUrl}
                            alt={`${item.title} – ${item.category} by EUCHARIA Stitches`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <div className="p-3.5">
                          <div className="flex items-center gap-1.5 text-[11px] text-[#9E7B36] font-medium truncate">
                            <span className="truncate">{item.category}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono-num text-[#1A1412] shrink-0">
                              {item.priceEstimate}
                            </span>
                          </div>
                          <h2 className="font-serif-display text-lg font-semibold text-[#1A1412] mt-1 line-clamp-1">
                            {item.title}
                          </h2>
                          <p className="text-[11px] text-[#5C4E47] mt-1 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <div className="px-3.5 pb-3.5 pt-2.5 border-t border-[#E6DEC8] flex items-center gap-1.5">
                        <a
                          href={whatsappEnquiryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-2 bg-[#1A1412] text-[#FAF7F2] text-[11px] font-medium rounded-lg hover:bg-[#2C211D] transition-colors whitespace-nowrap shrink-0"
                        >
                          <MessageCircle className="w-3 h-3 text-[#C5A059]" />
                          WhatsApp
                        </a>
                        <button
                          onClick={() => handleBookSpecificDesign(item.title, item.category)}
                          className="px-2.5 py-2 border border-[#E6DEC8] text-[#1A1412] hover:bg-[#F5EFE6] text-[11px] font-medium rounded-lg transition-colors whitespace-nowrap shrink-0"
                        >
                          Book
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* FABRIC LIBRARY SECTION WITHIN THE COLLECTIONS PAGE */}
            <FabricLibrary
              onSelectCategoryFilter={(cat) => {
                setSelectedCategory(cat);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onBookWithFabric={(fabricName, recommendedCategory) =>
                handleBookSpecificDesign(
                  `Bespoke ${recommendedCategory} in ${fabricName}`,
                  recommendedCategory,
                  fabricName
                )
              }
            />
          </section>
        )}

        {/* ==================== D. OUR SERVICES PAGE ==================== */}
        {activePage === 'services' && (
          <section className="max-w-7xl mx-auto px-6 py-10 space-y-12">
            <div className="max-w-3xl">
              <p className="text-xs text-[#9E7B36] font-medium">
                Bespoke Tailoring & Garment Construction
              </p>
              <h1 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#1A1412] mt-0.5">
                Our Fashion & Tailoring Services
              </h1>
              <p className="text-xs sm:text-sm text-[#5C4E47] mt-1.5 leading-relaxed">
                Every outfit crafted at EUCHARIA Stitches combines creative styling with accurate
                fittings. Explore our services below and enquire via WhatsApp or book an
                appointment at our Ado Ekiti studio.
              </p>
            </div>

            {/* Compact Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {services.map((srv, index) => {
                const whatsappServiceUrl = getWhatsAppLink(
                  `Hello EUCHARIA Stitches, I visited your website and would like to enquire about your "${srv.title}" service.`,
                  settings.whatsappNumber
                );
                return (
                  <div
                    key={srv.id}
                    className="bg-white border border-[#E6DEC8] rounded-xl overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <div className="h-44 w-full overflow-hidden bg-[#F5EFE6]">
                        <ResilientImage
                          src={srv.imageUrl}
                          alt={srv.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-1.5 text-[11px] text-[#9E7B36]">
                          <span className="font-mono-num">0{index + 1}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono-num">{srv.startingPrice}</span>
                          <span aria-hidden="true">·</span>
                          <span>{srv.turnaroundTime}</span>
                        </div>
                        <h2 className="font-serif-display text-xl font-semibold text-[#1A1412] mt-1">
                          {srv.title}
                        </h2>
                        <p className="text-xs text-[#5C4E47] mt-1.5 leading-relaxed">
                          {srv.description}
                        </p>
                      </div>
                    </div>
                    <div className="px-4 pb-4 pt-2.5 border-t border-[#E6DEC8] flex items-center gap-2">
                      <a
                        href={whatsappServiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#1A1412] text-[#FAF7F2] text-xs font-medium rounded-lg hover:bg-[#2C211D] transition-colors whitespace-nowrap shrink-0"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-[#C5A059]" />
                        WhatsApp
                      </a>
                      <button
                        onClick={() => handleBookSpecificDesign(srv.title, 'Custom-Made Designs')}
                        className="px-3 py-2 border border-[#E6DEC8] text-[#1A1412] hover:bg-[#F5EFE6] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0"
                      >
                        Book
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Delivery & Collection Policy Section */}
            <div className="bg-[#F5EFE6] border border-[#E6DEC8] rounded-2xl p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-8 space-y-2">
                <p className="text-xs text-[#9E7B36] font-medium">
                  Fittings, Collection & Nationwide Delivery
                </p>
                <h3 className="font-serif-display text-2xl font-semibold text-[#1A1412]">
                  Delivery and Studio Collection Policy
                </h3>
                <p className="text-xs sm:text-sm text-[#5C4E47] leading-relaxed">
                  {settings.deliveryPolicy}
                </p>
              </div>
              <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-2.5">
                <button
                  onClick={() => navigateTo('booking')}
                  className="w-full px-5 py-2.5 bg-[#1A1412] text-[#FAF7F2] text-xs font-semibold rounded-lg hover:bg-[#2C211D] transition-colors"
                >
                  Place an Order Enquiry
                </button>
                <button
                  onClick={() => navigateTo('contact')}
                  className="w-full px-5 py-2.5 border border-[#1A1412] text-[#1A1412] text-xs font-semibold rounded-lg hover:bg-white transition-colors"
                >
                  View Studio Location & Hours
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ==================== E. BOOK AN APPOINTMENT / PLACE AN ORDER ==================== */}
        {activePage === 'booking' && (
          <section className="max-w-4xl mx-auto px-6 py-10">
            <div className="mb-8">
              <p className="text-xs text-[#9E7B36] font-medium">
                Bespoke Order & Consultation Request · Instant Email & PDF Dossier
              </p>
              <h1 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#1A1412] mt-0.5">
                Book an Appointment or Place an Order
              </h1>
              <p className="text-xs sm:text-sm text-[#5C4E47] mt-1.5 leading-relaxed">
                Complete the form below with your outfit preferences, fabric choice, and desired
                dates. Once submitted, you will receive a formatted email summary, our administrator
                will be notified, and you can immediately download your official{' '}
                <strong>PDF Order Enquiry Dossier</strong>.
              </p>
            </div>

            {completedBooking ? (
              <div className="bg-white border border-[#C5A059] rounded-2xl p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E6DEC8] pb-5">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-mono-num text-[#9E7B36] font-semibold">
                        ORDER REFERENCE: {completedBooking.emailResult.refNumber}
                      </span>
                      <h2 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#1A1412]">
                        Order Enquiry Submitted, {completedBooking.enquiry.fullName}!
                      </h2>
                      <p className="text-xs text-[#5C4E47] mt-1">
                        Your order specifications have been recorded in the EUCHARIA Stitches Admin
                        Dashboard and formatted for both Client and Admin email delivery.
                      </p>
                    </div>
                  </div>

                  {/* Primary Action: Download Official PDF */}
                  <button
                    type="button"
                    onClick={() =>
                      downloadOrderEnquiryPdf(
                        completedBooking.enquiry,
                        settings,
                        completedBooking.emailResult.refNumber
                      )
                    }
                    className="inline-flex items-center gap-2 px-5 py-3 bg-[#C5A059] text-[#1A1412] text-xs font-bold rounded-lg hover:bg-[#d4b26c] transition-colors whitespace-nowrap shrink-0 shadow-sm"
                  >
                    <FileDown className="w-4 h-4" />
                    Download Order PDF
                  </button>
                </div>

                {/* Professional Email Notification Panel (Client Email + Admin Email) */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 p-1 bg-[#F5EFE6] rounded-lg border border-[#E6DEC8]">
                      <button
                        type="button"
                        onClick={() => setShowEmailPreviewTab('client')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          showEmailPreviewTab === 'client'
                            ? 'bg-[#1A1412] text-[#FAF7F2]'
                            : 'text-[#5C4E47] hover:text-[#1A1412]'
                        }`}
                      >
                        Client Confirmation Email
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowEmailPreviewTab('admin')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          showEmailPreviewTab === 'admin'
                            ? 'bg-[#1A1412] text-[#FAF7F2]'
                            : 'text-[#5C4E47] hover:text-[#1A1412]'
                        }`}
                      >
                        Admin Notification Email
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {completedBooking.enquiry.email && (
                        <a
                          href={`mailto:${completedBooking.enquiry.email}?subject=${encodeURIComponent(
                            completedBooking.emailResult.clientEmailSubject
                          )}&body=${encodeURIComponent(
                            completedBooking.emailResult.clientEmailBodyText
                          )}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#E6DEC8] text-[#1A1412] hover:bg-[#FAF7F2] text-xs font-medium rounded-lg"
                        >
                          <Mail className="w-3.5 h-3.5 text-[#9E7B36]" />
                          Open Client Email in Mail App
                        </a>
                      )}
                      <a
                        href={`mailto:${BOOTSTRAPPED_ADMIN_EMAIL}?subject=${encodeURIComponent(
                          completedBooking.emailResult.adminEmailSubject
                        )}&body=${encodeURIComponent(
                          completedBooking.emailResult.adminEmailBodyText
                        )}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#C5A059] text-[#1A1412] hover:bg-[#FAF7F2] text-xs font-medium rounded-lg"
                      >
                        <Mail className="w-3.5 h-3.5 text-[#9E7B36]" />
                        Send Copy to Admin Email
                      </a>
                    </div>
                  </div>

                  {/* Rendered Professional HTML Email Preview */}
                  <div className="p-4 bg-[#FAF7F2] border border-[#E6DEC8] rounded-xl">
                    {showEmailPreviewTab === 'client' ? (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: completedBooking.emailResult.clientEmailHtml,
                        }}
                      />
                    ) : (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: completedBooking.emailResult.adminEmailHtml,
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Action Bar */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      downloadOrderEnquiryPdf(
                        completedBooking.enquiry,
                        settings,
                        completedBooking.emailResult.refNumber
                      )
                    }
                    className="inline-flex items-center gap-2 px-5 py-3 bg-[#1A1412] text-[#FAF7F2] text-xs font-semibold rounded-lg hover:bg-[#2C211D] transition-colors whitespace-nowrap shrink-0"
                  >
                    <FileDown className="w-4 h-4 text-[#C5A059]" />
                    Download PDF Summary
                  </button>
                  <a
                    href={getWhatsAppLink(
                      `Hello EUCHARIA Stitches, my name is ${completedBooking.enquiry.fullName}. I just submitted Order Enquiry [${completedBooking.emailResult.refNumber}] for "${completedBooking.enquiry.outfitType}" (${completedBooking.enquiry.category}) for a ${completedBooking.enquiry.occasion}, with desired delivery around ${completedBooking.enquiry.deliveryDate}.`,
                      settings.whatsappNumber
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 border border-[#1A1412] text-[#1A1412] hover:bg-[#F5EFE6] text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    <MessageCircle className="w-4 h-4 text-[#9E7B36]" />
                    Continue on WhatsApp
                  </a>
                  <button
                    onClick={() => setCompletedBooking(null)}
                    className="px-4 py-3 text-xs font-medium text-[#5C4E47] hover:text-[#1A1412] transition-colors"
                  >
                    Submit Another Enquiry
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleBookingSubmit}
                className="bg-white border border-[#E6DEC8] rounded-2xl p-6 sm:p-8 space-y-5"
              >
                {bookingError && (
                  <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                    {bookingError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#1A1412] mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={bookingForm.fullName}
                      onChange={(e) =>
                        setBookingForm({ ...bookingForm, fullName: e.target.value })
                      }
                      placeholder="e.g. Adesuwa Ogunleye"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#1A1412] mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={bookingForm.phone}
                      onChange={(e) =>
                        setBookingForm({ ...bookingForm, phone: e.target.value })
                      }
                      placeholder="e.g. 0803 000 0000"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg font-mono-num"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#1A1412] mb-1">
                      WhatsApp Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={bookingForm.whatsapp}
                      onChange={(e) =>
                        setBookingForm({ ...bookingForm, whatsapp: e.target.value })
                      }
                      placeholder="e.g. 0810 976 6393"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg font-mono-num"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#1A1412] mb-1">
                      Client Email Address (For Order Confirmation Email)
                    </label>
                    <input
                      type="email"
                      value={bookingForm.email}
                      onChange={(e) =>
                        setBookingForm({ ...bookingForm, email: e.target.value })
                      }
                      placeholder="you@example.com"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E6DEC8]">
                  <div>
                    <label className="block text-xs font-medium text-[#1A1412] mb-1">
                      Type of Outfit Wanted *
                    </label>
                    <input
                      type="text"
                      required
                      value={bookingForm.outfitType}
                      onChange={(e) =>
                        setBookingForm({ ...bookingForm, outfitType: e.target.value })
                      }
                      placeholder="e.g. Beaded Corset Aso-Ebi Gown with Gele"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#1A1412] mb-1">
                      Preferred Clothing Category *
                    </label>
                    <select
                      value={bookingForm.category}
                      onChange={(e) =>
                        setBookingForm({ ...bookingForm, category: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 text-sm bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg"
                    >
                      {COLLECTION_CATEGORIES.filter((c) => c !== 'All Categories').map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#1A1412] mb-1">
                      Occasion *
                    </label>
                    <input
                      type="text"
                      required
                      value={bookingForm.occasion}
                      onChange={(e) =>
                        setBookingForm({ ...bookingForm, occasion: e.target.value })
                      }
                      placeholder="Wedding, Birthday, Church, Corporate, Casual..."
                      className="w-full px-3.5 py-2.5 text-sm bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#1A1412] mb-1">
                      Preferred Fabric (Optional)
                    </label>
                    <input
                      type="text"
                      value={bookingForm.preferredFabric}
                      onChange={(e) =>
                        setBookingForm({ ...bookingForm, preferredFabric: e.target.value })
                      }
                      placeholder="e.g. Hand-Woven Aso-Oke, French Chantilly Lace, Ankara"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#1A1412] mb-1">
                      Preferred Colour(s) *
                    </label>
                    <input
                      type="text"
                      required
                      value={bookingForm.preferredColor}
                      onChange={(e) =>
                        setBookingForm({ ...bookingForm, preferredColor: e.target.value })
                      }
                      placeholder="e.g. Champagne Gold & Ivory"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#1A1412] mb-1">
                        Appointment Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={bookingForm.appointmentDate}
                        onChange={(e) =>
                          setBookingForm({
                            ...bookingForm,
                            appointmentDate: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2.5 text-xs bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg font-mono-num"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#1A1412] mb-1">
                        Required Delivery *
                      </label>
                      <input
                        type="date"
                        required
                        value={bookingForm.deliveryDate}
                        onChange={(e) =>
                          setBookingForm({
                            ...bookingForm,
                            deliveryDate: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2.5 text-xs bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg font-mono-num"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1A1412] mb-1">
                    Additional Instructions or Measurement Details
                  </label>
                  <textarea
                    rows={3}
                    value={bookingForm.instructions}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, instructions: e.target.value })
                    }
                    placeholder="Share sleeve preferences, neckline style, whether you already have the fabric, or any specific measurements..."
                    className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg"
                  />
                </div>

                {/* Upload Fabric or Style Inspiration Photograph */}
                <div className="p-3.5 bg-[#FAF7F2] border border-[#E6DEC8] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-[#1A1412]">
                      Upload Fabric or Style Inspiration Photograph (Optional)
                    </p>
                    <p className="text-[11px] text-[#5C4E47] mt-0.5">
                      Attach a photo of your fabric or a reference design (embedded in your PDF Dossier).
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-[#E6DEC8] rounded-lg text-xs font-medium cursor-pointer hover:bg-[#F5EFE6] transition-colors shrink-0">
                    <Upload className="w-3.5 h-3.5 text-[#9E7B36]" />
                    {bookingUploading
                      ? 'Compressing Photo...'
                      : bookingForm.inspirationImage
                      ? 'Change Uploaded Photo'
                      : 'Choose Photo'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setBookingUploading(true);
                        try {
                          const compressed = await compressImageFile(file);
                          setBookingForm((prev) => ({
                            ...prev,
                            inspirationImage: compressed,
                          }));
                        } catch {
                          setBookingError('Could not process the selected image file.');
                        } finally {
                          setBookingUploading(false);
                        }
                      }}
                    />
                  </label>
                </div>

                {bookingForm.inspirationImage && (
                  <div className="flex items-center gap-3">
                    <img
                      src={bookingForm.inspirationImage}
                      alt="Uploaded style inspiration preview"
                      className="w-16 h-20 object-cover rounded-lg border border-[#E6DEC8]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setBookingForm((prev) => ({ ...prev, inspirationImage: '' }))
                      }
                      className="text-xs text-red-700 hover:underline"
                    >
                      Remove attached photo
                    </button>
                  </div>
                )}

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={bookingSubmitting}
                    className="w-full sm:w-auto px-8 py-3.5 bg-[#1A1412] text-[#FAF7F2] text-xs font-semibold rounded-lg hover:bg-[#2C211D] transition-colors disabled:opacity-50"
                  >
                    {bookingSubmitting ? 'Submitting Enquiry...' : 'Submit Order Enquiry'}
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        {/* ==================== F & G. GALLERY / OUR WORK (5-IN-A-ROW) & TESTIMONIALS ==================== */}
        {activePage === 'gallery' && (
          <div className="space-y-12 py-10">
            {/* Portfolio Gallery */}
            <section className="max-w-7xl mx-auto px-6">
              <div className="max-w-3xl">
                <p className="text-xs text-[#9E7B36] font-medium">
                  Our Work & Craftsmanship Showcase · 5-in-a-Row Portfolio
                </p>
                <h1 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#1A1412] mt-0.5">
                  Portfolio Gallery
                </h1>
                <p className="text-xs sm:text-sm text-[#5C4E47] mt-1 leading-relaxed">
                  Browse completed fashion designs and studio work from EUCHARIA Stitches. Click any
                  photograph to view it in full-screen high resolution.
                </p>
              </div>

              {/* Category Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-3 mt-2">
                {COLLECTION_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setGalleryCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                      galleryCategory === cat
                        ? 'bg-[#1A1412] text-[#FAF7F2]'
                        : 'bg-white border border-[#E6DEC8] text-[#5C4E47] hover:text-[#1A1412]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* 5-in-a-Row Gallery Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-4">
                {filteredGallery.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => setLightboxPhoto(photo)}
                    className="group cursor-pointer bg-white border border-[#E6DEC8] rounded-xl overflow-hidden flex flex-col justify-between"
                  >
                    <div className="h-48 w-full overflow-hidden relative bg-[#F5EFE6]">
                      <ResilientImage
                        src={photo.imageUrl}
                        alt={photo.caption}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1412]/90 text-[#FAF7F2] text-[11px] font-medium rounded-lg">
                          <Maximize2 className="w-3 h-3 text-[#C5A059]" />
                          Full View
                        </span>
                      </div>
                    </div>
                    <div className="p-3.5">
                      <p className="text-[11px] text-[#9E7B36] truncate">{photo.category}</p>
                      <p className="font-serif-display text-sm font-semibold text-[#1A1412] mt-0.5 line-clamp-2">
                        {photo.caption}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Customer Testimonials & Review Submission */}
            <section className="bg-[#F5EFE6] border-t border-[#E6DEC8] py-12">
              <div className="max-w-7xl mx-auto px-6 space-y-10">
                <div className="max-w-2xl">
                  <p className="text-xs text-[#9E7B36] font-medium">
                    Client Experiences · Moderated by Administrator
                  </p>
                  <h2 className="font-serif-display text-3xl font-semibold text-[#1A1412] mt-0.5">
                    Customer Testimonials
                  </h2>
                  <p className="text-xs text-[#5C4E47] mt-1 leading-relaxed">
                    Clearly labelled sample placeholders are displayed below until verified client
                    reviews are submitted and approved in the Administrator Dashboard.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {publishedTestimonials.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white border border-[#E6DEC8] rounded-xl p-5 flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-1 text-[#C5A059]">
                          {Array.from({ length: item.rating || 5 }).map((_, idx) => (
                            <Star key={idx} className="w-3.5 h-3.5 fill-[#C5A059]" />
                          ))}
                        </div>
                        <p className="text-xs sm:text-sm text-[#1A1412] leading-relaxed">
                          "{item.review}"
                        </p>
                      </div>
                      <div className="flex items-center gap-3 pt-3 border-t border-[#E6DEC8]">
                        {item.photoUrl && (
                          <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-[#E6DEC8]">
                            <ResilientImage
                              src={item.photoUrl}
                              alt={item.customerName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-semibold text-[#1A1412]">
                            {item.customerName}
                          </p>
                          <p className="text-[11px] text-[#9E7B36]">{item.roleOrOccasion}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Submit Customer Review Form */}
                <div className="bg-white border border-[#E6DEC8] rounded-2xl p-6 max-w-2xl">
                  <h3 className="font-serif-display text-2xl font-semibold text-[#1A1412]">
                    Share Your Experience with EUCHARIA Stitches
                  </h3>
                  <p className="text-xs text-[#5C4E47] mt-0.5">
                    Submitted reviews are moderated by our studio administrator before publication.
                  </p>

                  {reviewSubmitted ? (
                    <div className="mt-4 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                      Thank you! Your testimonial has been submitted and is awaiting administrator
                      approval in the Admin Dashboard.
                    </div>
                  ) : (
                    <form onSubmit={handleReviewSubmit} className="mt-4 space-y-3.5">
                      {reviewError && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                          {reviewError}
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs font-medium text-[#1A1412] mb-1">
                            Your Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={reviewForm.customerName}
                            onChange={(e) =>
                              setReviewForm({ ...reviewForm, customerName: e.target.value })
                            }
                            placeholder="e.g. Mrs. Folake Adebayo"
                            className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#1A1412] mb-1">
                            Outfit / Occasion *
                          </label>
                          <input
                            type="text"
                            required
                            value={reviewForm.roleOrOccasion}
                            onChange={(e) =>
                              setReviewForm({ ...reviewForm, roleOrOccasion: e.target.value })
                            }
                            placeholder="e.g. Bridal Reception Gown"
                            className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-center">
                        <div>
                          <label className="block text-xs font-medium text-[#1A1412] mb-1">
                            Star Rating *
                          </label>
                          <select
                            value={reviewForm.rating}
                            onChange={(e) =>
                              setReviewForm({
                                ...reviewForm,
                                rating: Number(e.target.value),
                              })
                            }
                            className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg"
                          >
                            <option value={5}>5 Stars – Excellent</option>
                            <option value={4}>4 Stars – Very Good</option>
                            <option value={3}>3 Stars – Good</option>
                            <option value={2}>2 Stars – Fair</option>
                            <option value={1}>1 Star – Needs Improvement</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#1A1412] mb-1">
                            Optional Outfit Photo
                          </label>
                          <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg text-xs font-medium cursor-pointer hover:bg-[#F5EFE6]">
                            <Upload className="w-3.5 h-3.5 text-[#9E7B36]" />
                            {reviewForm.photoUrl ? 'Photo Attached' : 'Upload Photo'}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const dataUrl = await compressImageFile(file);
                                setReviewForm((prev) => ({ ...prev, photoUrl: dataUrl }));
                              }}
                            />
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#1A1412] mb-1">
                          Your Review *
                        </label>
                        <textarea
                          rows={2}
                          required
                          value={reviewForm.review}
                          onChange={(e) =>
                            setReviewForm({ ...reviewForm, review: e.target.value })
                          }
                          placeholder="Tell us about the fitting, craftsmanship, and service..."
                          className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-[#1A1412] text-[#FAF7F2] text-xs font-semibold rounded-lg hover:bg-[#2C211D] transition-colors"
                      >
                        Submit Review for Approval
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ==================== H. CONTACT US PAGE ==================== */}
        {activePage === 'contact' && (
          <section className="max-w-7xl mx-auto px-6 py-10 space-y-10">
            <div className="max-w-3xl">
              <p className="text-xs text-[#9E7B36] font-medium">
                Visit or Reach Our Showroom
              </p>
              <h1 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#1A1412] mt-0.5">
                Contact EUCHARIA Stitches
              </h1>
              <p className="text-xs sm:text-sm text-[#5C4E47] mt-1 leading-relaxed">
                Reach out to us directly via WhatsApp, phone call, Live AI Chat, or visit our
                fashion studio in Olorunsogo, Ado Ekiti for fittings and consultations.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 space-y-5">
                <div className="bg-white border border-[#E6DEC8] rounded-xl p-6 space-y-4">
                  <div>
                    <p className="text-xs text-[#9E7B36] font-medium">Showroom Address</p>
                    <p className="font-serif-display text-xl font-semibold text-[#1A1412] mt-0.5">
                      EUCHARIA Stitches
                    </p>
                    <p className="text-xs sm:text-sm text-[#5C4E47] mt-1 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-[#9E7B36] shrink-0 mt-0.5" />
                      <span>{settings.address}</span>
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#E6DEC8] space-y-2.5">
                    <p className="text-xs text-[#9E7B36] font-medium">
                      Direct Lines & WhatsApp
                    </p>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <a
                        href={getWhatsAppLink(undefined, settings.whatsappNumber)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#1A1412] text-[#FAF7F2] text-xs font-medium rounded-lg hover:bg-[#2C211D] transition-colors whitespace-nowrap shrink-0"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-[#C5A059]" />
                        WhatsApp: {settings.whatsappNumber}
                      </a>
                      <a
                        href={`tel:${settings.whatsappNumber}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#E6DEC8] text-[#1A1412] text-xs font-medium rounded-lg hover:bg-[#FAF7F2] transition-colors font-mono-num whitespace-nowrap shrink-0"
                      >
                        <Phone className="w-3.5 h-3.5 text-[#9E7B36]" />
                        Call {settings.whatsappNumber}
                      </a>
                      <a
                        href={`tel:${settings.altPhoneNumber}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#E6DEC8] text-[#1A1412] text-xs font-medium rounded-lg hover:bg-[#FAF7F2] transition-colors font-mono-num whitespace-nowrap shrink-0"
                      >
                        <Phone className="w-3.5 h-3.5 text-[#9E7B36]" />
                        Alt: {settings.altPhoneNumber}
                      </a>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E6DEC8]">
                    <p className="text-xs text-[#9E7B36] font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Business Opening Hours
                    </p>
                    <p className="text-xs text-[#5C4E47] mt-1 leading-relaxed">
                      {settings.openingHours}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#E6DEC8] flex items-center gap-4">
                    <a
                      href={settings.instagramUrl || 'https://instagram.com'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1A1412] hover:text-[#9E7B36]"
                    >
                      <Instagram className="w-4 h-4 text-[#9E7B36]" />
                      Instagram
                    </a>
                    <a
                      href={settings.facebookUrl || 'https://facebook.com'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1A1412] hover:text-[#9E7B36]"
                    >
                      <Facebook className="w-4 h-4 text-[#9E7B36]" />
                      Facebook
                    </a>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7">
                <form
                  onSubmit={handleContactSubmit}
                  className="bg-white border border-[#E6DEC8] rounded-xl p-6 space-y-4"
                >
                  <h2 className="font-serif-display text-2xl font-semibold text-[#1A1412]">
                    Send Us a Message
                  </h2>
                  {contactSubmitted && (
                    <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                      Thank you for your message! Our team at EUCHARIA Stitches has received it and
                      will respond shortly.
                    </div>
                  )}
                  {contactError && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                      {contactError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#1A1412] mb-1">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={contactForm.name}
                        onChange={(e) =>
                          setContactForm({ ...contactForm, name: e.target.value })
                        }
                        className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#1A1412] mb-1">
                        Phone / WhatsApp Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={contactForm.phone}
                        onChange={(e) =>
                          setContactForm({ ...contactForm, phone: e.target.value })
                        }
                        className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg font-mono-num"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#1A1412] mb-1">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        value={contactForm.email}
                        onChange={(e) =>
                          setContactForm({ ...contactForm, email: e.target.value })
                        }
                        className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#1A1412] mb-1">
                        Subject *
                      </label>
                      <input
                        type="text"
                        required
                        value={contactForm.subject}
                        onChange={(e) =>
                          setContactForm({ ...contactForm, subject: e.target.value })
                        }
                        placeholder="e.g. Aso-Ebi Group Order Enquiry"
                        className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#1A1412] mb-1">
                      Message *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={contactForm.message}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, message: e.target.value })
                      }
                      className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#1A1412] text-[#FAF7F2] text-xs font-semibold rounded-lg hover:bg-[#2C211D] transition-colors"
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </div>

            {/* Google Maps Location Integration */}
            <div className="space-y-2.5">
              <h2 className="font-serif-display text-2xl font-semibold text-[#1A1412]">
                Find Us on Google Maps — Olorunsogo, Ado Ekiti
              </h2>
              <StudioMap
                address={settings.address}
                whatsappNumber={settings.whatsappNumber}
              />
            </div>
          </section>
        )}

        {/* ==================== 5. ADMIN DASHBOARD ==================== */}
        {activePage === 'admin' && (
          <AdminDashboard
            user={user}
            collections={collections}
            setCollections={setCollections}
            services={services}
            setServices={setServices}
            gallery={gallery}
            setGallery={setGallery}
            testimonials={testimonials}
            setTestimonials={setTestimonials}
            enquiries={enquiries}
            setEnquiries={setEnquiries}
            contactMessages={contactMessages}
            setContactMessages={setContactMessages}
            subscribersCount={subscribersCount}
            settings={settings}
            setSettings={setSettings}
            onPersistState={persistStudioState}
            onCloseAdmin={() => navigateTo('home')}
          />
        )}

        {/* ==================== PRIVACY POLICY & TERMS ==================== */}
        {activePage === 'privacy' && (
          <section className="max-w-3xl mx-auto px-6 py-12 space-y-5">
            <h1 className="font-serif-display text-4xl font-semibold text-[#1A1412]">
              Privacy Policy
            </h1>
            <p className="text-sm text-[#5C4E47] leading-relaxed">
              EUCHARIA Stitches respects your privacy and protects the personal information you
              provide when booking an appointment, submitting an order enquiry, or subscribing to
              our lookbook updates.
            </p>
            <div className="space-y-3 text-sm text-[#5C4E47] leading-relaxed">
              <p>
                <strong className="text-[#1A1412]">1. Information We Collect:</strong> We collect
                your name, phone number, WhatsApp number, optional email address, garment
                preferences, and style inspiration photographs solely for reviewing and fulfilling
                your bespoke tailoring enquiries.
              </p>
              <p>
                <strong className="text-[#1A1412]">2. Data Security:</strong> Customer order
                enquiries and contact details are stored securely and restricted strictly to
                authorized EUCHARIA Stitches studio administration.
              </p>
              <p>
                <strong className="text-[#1A1412]">3. Google Maps Integration:</strong> Our Contact
                page integrates Google Maps features subject to the Google Maps End User Additional
                Terms of Service and Google Privacy Policy.
              </p>
            </div>
            <button
              onClick={() => navigateTo('home')}
              className="px-5 py-2.5 bg-[#1A1412] text-[#FAF7F2] text-xs font-medium rounded-lg"
            >
              Return Home
            </button>
          </section>
        )}

        {activePage === 'terms' && (
          <section className="max-w-3xl mx-auto px-6 py-12 space-y-5">
            <h1 className="font-serif-display text-4xl font-semibold text-[#1A1412]">
              Terms and Conditions
            </h1>
            <div className="space-y-3 text-sm text-[#5C4E47] leading-relaxed">
              <p>
                <strong className="text-[#1A1412]">1. Order Enquiry Review:</strong> Submitting an
                online appointment or order enquiry does not automatically confirm a price, garment
                order, or delivery date until reviewed and agreed upon with EUCHARIA Stitches.
              </p>
              <p>
                <strong className="text-[#1A1412]">2. Measurements & Fittings:</strong> Clients are
                encouraged to attend scheduled studio fittings at Road 1, Zone 8, Olorunsogo, Ado
                Ekiti, or provide accurate measurements for distant orders.
              </p>
              <p>
                <strong className="text-[#1A1412]">3. Delivery & Collection:</strong>{' '}
                {settings.deliveryPolicy}
              </p>
            </div>
            <button
              onClick={() => navigateTo('home')}
              className="px-5 py-2.5 bg-[#1A1412] text-[#FAF7F2] text-xs font-medium rounded-lg"
            >
              Return Home
            </button>
          </section>
        )}

        {/* ==================== CUSTOM 404 PAGE ==================== */}
        {activePage === 'not-found' && (
          <section className="max-w-xl mx-auto px-6 py-20 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#1A1412] text-[#C5A059] flex items-center justify-center mx-auto font-serif-display text-xl">
              404
            </div>
            <h1 className="font-serif-display text-4xl font-semibold text-[#1A1412]">
              Page Not Found
            </h1>
            <p className="text-sm text-[#5C4E47]">
              The page you are looking for is unavailable. Return to the EUCHARIA Stitches showroom
              to explore our collections.
            </p>
            <button
              onClick={() => navigateTo('home')}
              className="px-6 py-3 bg-[#1A1412] text-[#FAF7F2] text-xs font-semibold rounded-lg"
            >
              Back to Homepage
            </button>
          </section>
        )}
      </main>

      {/* FULL-SCREEN PORTFOLIO LIGHTBOX MODAL */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 sm:p-8"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="max-w-4xl w-full bg-[#1A1412] border border-white/15 rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative max-h-[75vh] overflow-hidden bg-black flex items-center justify-center">
              <ResilientImage
                src={lightboxPhoto.imageUrl}
                alt={lightboxPhoto.caption}
                className="max-h-[75vh] w-auto object-contain"
              />
              <button
                onClick={() => setLightboxPhoto(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/70 text-white hover:bg-black"
                aria-label="Close Fullscreen View"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-[#C5A059]">{lightboxPhoto.category}</p>
                <p className="font-serif-display text-xl text-white mt-0.5">
                  {lightboxPhoto.caption}
                </p>
              </div>
              <a
                href={getWhatsAppLink(
                  `Hello EUCHARIA Stitches, I admired "${lightboxPhoto.caption}" in your portfolio gallery and would like to make an enquiry.`,
                  settings.whatsappNumber
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#C5A059] text-[#1A1412] text-xs font-semibold rounded-lg whitespace-nowrap shrink-0"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Enquire on WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

      {/* LIVE AI CHAT WIDGET */}
      <LiveChatWidget
        settings={settings}
        onNavigateToBooking={() => navigateTo('booking')}
      />

      {/* FLOATING WHATSAPP CHAT BUTTON */}
      <a
        href={getWhatsAppLink(undefined, settings.whatsappNumber)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with EUCHARIA Stitches on WhatsApp"
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 px-4 py-3 rounded-full bg-[#1A1412] text-[#FAF7F2] border border-[#C5A059]/60 shadow-lg hover:bg-[#2C211D] transition-transform duration-200 hover:-translate-y-0.5"
      >
        <MessageCircle className="w-5 h-5 text-[#C5A059]" />
        <span className="text-xs font-semibold hidden sm:inline whitespace-nowrap">
          Enquire on WhatsApp
        </span>
      </a>

      {/* LUXURIOUS HOMEPAGE FOOTER */}
      <footer className="bg-[#1A1412] text-[#FAF7F2] border-t border-[#2C211D] mt-12">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full border border-[#C5A059] flex items-center justify-center font-serif-display text-sm font-bold text-[#C5A059]">
                ES
              </div>
              <span className="font-serif-display text-2xl font-semibold text-white">
                EUCHARIA Stitches
              </span>
            </div>
            <p className="font-serif-display italic text-base text-[#C5A059]">
              "Elegance in Every Stitch."
            </p>
            <p className="text-xs text-[#D6CEC2] leading-relaxed max-w-sm">
              Professional Fashion Design, Tailoring and Custom Clothing studio dedicated to
              bespoke Nigerian traditional wear, Aso-Ebi, bridal gowns, corporate attire, and
              children’s outfits.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a
                href={settings.instagramUrl || 'https://instagram.com'}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="EUCHARIA Stitches Instagram"
                className="p-2 rounded-lg border border-white/15 text-[#C5A059] hover:bg-white/5 transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={settings.facebookUrl || 'https://facebook.com'}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="EUCHARIA Stitches Facebook"
                className="p-2 rounded-lg border border-white/15 text-[#C5A059] hover:bg-white/5 transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href={getWhatsAppLink(undefined, settings.whatsappNumber)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="EUCHARIA Stitches WhatsApp"
                className="p-2 rounded-lg border border-white/15 text-[#C5A059] hover:bg-white/5 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2 space-y-2.5">
            <p className="text-xs font-semibold text-[#C5A059]">Quick Links</p>
            <ul className="space-y-1.5 text-xs text-[#D6CEC2]">
              {[
                { id: 'home', label: 'Home' },
                { id: 'about', label: 'About Us' },
                { id: 'collections', label: 'Collections & Fabrics' },
                { id: 'services', label: 'Services' },
                { id: 'gallery', label: 'Gallery' },
                { id: 'booking', label: 'Book Appointment' },
                { id: 'contact', label: 'Contact' },
              ].map((link) => (
                <li key={link.id}>
                  <button
                    onClick={() => navigateTo(link.id as PageRoute)}
                    className="hover:text-white transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Location */}
          <div className="lg:col-span-3 space-y-2.5">
            <p className="text-xs font-semibold text-[#C5A059]">Contact & Studio Location</p>
            <div className="space-y-1.5 text-xs text-[#D6CEC2]">
              <p className="leading-relaxed">{settings.address}</p>
              <p className="font-mono-num">
                WhatsApp:{' '}
                <a
                  href={getWhatsAppLink(undefined, settings.whatsappNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-[#C5A059]"
                >
                  {settings.whatsappNumber}
                </a>
              </p>
              <p className="font-mono-num">
                Phone:{' '}
                <a
                  href={`tel:${settings.altPhoneNumber}`}
                  className="text-white hover:text-[#C5A059]"
                >
                  {settings.altPhoneNumber}
                </a>
              </p>
            </div>
          </div>

          {/* Lookbook Newsletter Subscription */}
          <div className="lg:col-span-3 space-y-2.5">
            <p className="text-xs font-semibold text-[#C5A059]">
              Seasonal Lookbook & Style Updates
            </p>
            <p className="text-xs text-[#D6CEC2] leading-relaxed">
              Subscribe to receive updates when new Aso-Ebi, Ankara, and bridal collections arrive
              at our showroom.
            </p>
            {newsletterSuccess ? (
              <p className="text-xs text-emerald-400">
                Thank you for subscribing to EUCHARIA Stitches updates!
              </p>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="flex items-center gap-2">
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email..."
                  className="flex-1 px-3 py-2 text-xs bg-[#241C19] border border-white/15 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-[#C5A059]"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-[#C5A059] text-[#1A1412] text-xs font-semibold rounded-lg hover:bg-[#d4b26c] transition-colors whitespace-nowrap shrink-0"
                >
                  Join
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Copyright & Legal Bar */}
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9E9289]">
            <p>
              © {new Date().getFullYear()} EUCHARIA Stitches. All rights reserved. Road 1, Zone 8,
              Olorunsogo, Ado Ekiti, Nigeria.
            </p>
            <div className="flex flex-wrap items-center gap-5">
              <button
                onClick={() => navigateTo('privacy')}
                className="hover:text-white transition-colors"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => navigateTo('terms')}
                className="hover:text-white transition-colors"
              >
                Terms & Conditions
              </button>
              <button
                onClick={() => navigateTo('admin')}
                className="inline-flex items-center gap-1 text-[#C5A059] hover:underline font-medium"
              >
                <Lock className="w-3 h-3" />
                Admin Portal
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
