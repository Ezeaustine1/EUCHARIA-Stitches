import React, { useState, useEffect } from 'react';
import {
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleAuthProvider,
  BOOTSTRAPPED_ADMIN_EMAIL,
  compressImageFile,
} from '../lib/firebase.ts';
import {
  CollectionItem,
  ServiceItem,
  GalleryPhoto,
  OrderEnquiry,
  ContactMessage,
  Testimonial,
  SiteSettings,
  COLLECTION_CATEGORIES,
  DEFAULT_COLLECTIONS,
  DEFAULT_SERVICES,
  DEFAULT_GALLERY,
  DEFAULT_SETTINGS,
  getWhatsAppLink,
} from '../data/initialData.ts';
import {
  downloadOrderEnquiryPdf,
  buildProfessionalEmails,
} from '../utils/pdfGenerator.ts';
import { ResilientImage } from './ResilientImage.tsx';
import {
  LogOut,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Upload,
  MessageCircle,
  Settings,
  ShoppingBag,
  Scissors,
  Image as ImageIcon,
  Star,
  Mail,
  Sparkles,
  Edit3,
  Lock,
  FileDown,
  KeyRound,
  Eye,
} from 'lucide-react';

interface AdminDashboardProps {
  user: User | null;
  collections: CollectionItem[];
  setCollections: React.Dispatch<React.SetStateAction<CollectionItem[]>>;
  services: ServiceItem[];
  setServices: React.Dispatch<React.SetStateAction<ServiceItem[]>>;
  gallery: GalleryPhoto[];
  setGallery: React.Dispatch<React.SetStateAction<GalleryPhoto[]>>;
  testimonials: Testimonial[];
  setTestimonials: React.Dispatch<React.SetStateAction<Testimonial[]>>;
  enquiries: OrderEnquiry[];
  setEnquiries: React.Dispatch<React.SetStateAction<OrderEnquiry[]>>;
  contactMessages: ContactMessage[];
  setContactMessages: React.Dispatch<React.SetStateAction<ContactMessage[]>>;
  subscribersCount: number;
  settings: SiteSettings;
  setSettings: React.Dispatch<React.SetStateAction<SiteSettings>>;
  onPersistState: (partial: Record<string, any>) => void;
  onCloseAdmin: () => void;
}

type AdminTab =
  | 'enquiries'
  | 'collections'
  | 'services'
  | 'gallery'
  | 'testimonials'
  | 'messages'
  | 'emails'
  | 'settings';

const ADMIN_PASSCODE = 'eucharia2026';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  collections,
  setCollections,
  services,
  setServices,
  gallery,
  setGallery,
  testimonials,
  setTestimonials,
  enquiries,
  setEnquiries,
  contactMessages,
  setContactMessages,
  subscribersCount,
  settings,
  setSettings,
  onPersistState,
  onCloseAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('enquiries');
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordAuthenticated, setPasswordAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('eucharia_admin_auth') === 'true';
  });

  const [authError, setAuthError] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewEmailEnquiry, setPreviewEmailEnquiry] = useState<OrderEnquiry | null>(null);

  // Collection Form State
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [colForm, setColForm] = useState({
    title: '',
    category: 'Aso-Ebi',
    description: '',
    imageUrl: '',
    priceEstimate: 'From ₦75,000',
    featured: true,
  });

  // Service Form State
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [srvForm, setSrvForm] = useState({
    title: '',
    description: '',
    imageUrl: '',
    startingPrice: 'From ₦45,000',
    turnaroundTime: '7–14 Working Days',
  });

  // Gallery Form State
  const [galForm, setGalForm] = useState({
    caption: '',
    category: 'Aso-Ebi',
    imageUrl: '',
    featured: true,
  });

  // Site Settings Form State
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(settings);

  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  const isGoogleAdmin =
    Boolean(user) &&
    user?.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();

  const isAuthorizedAdmin = passwordAuthenticated || isGoogleAdmin;

  const showNotice = (type: 'success' | 'error', text: string) => {
    setStatusBanner({ type, text });
    setTimeout(() => setStatusBanner(null), 5000);
  };

  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (passwordInput.trim() === ADMIN_PASSCODE) {
      sessionStorage.setItem('eucharia_admin_auth', 'true');
      setPasswordAuthenticated(true);
      setPasswordInput('');
    } else {
      setAuthError('Invalid administrator password. Please enter the correct studio password.');
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err: any) {
      setAuthError(err?.message || 'Unable to sign in with Google. Please use the studio password above.');
    }
  };

  const handleSignOut = async () => {
    sessionStorage.removeItem('eucharia_admin_auth');
    setPasswordAuthenticated(false);
    if (user) {
      await signOut(auth);
    }
  };

  const handleResetDefaultCatalog = async () => {
    setCollections(DEFAULT_COLLECTIONS);
    setServices(DEFAULT_SERVICES);
    setGallery(DEFAULT_GALLERY);
    setSettings(DEFAULT_SETTINGS);
    onPersistState({
      collections: DEFAULT_COLLECTIONS,
      services: DEFAULT_SERVICES,
      gallery: DEFAULT_GALLERY,
      settings: DEFAULT_SETTINGS,
    });
    if (isGoogleAdmin) {
      try {
        for (const item of DEFAULT_COLLECTIONS) {
          const { id, ...data } = item;
          await setDoc(doc(db, 'collections', id), data);
        }
      } catch {
        // Local persistence already updated
      }
    }
    showNotice('success', 'Default showroom collections, services, and gallery synced.');
  };

  const handleEnquiryStatusChange = async (
    enquiry: OrderEnquiry,
    newStatus: OrderEnquiry['status']
  ) => {
    const updated = enquiries.map((e) =>
      e.id === enquiry.id ? { ...e, status: newStatus } : e
    );
    setEnquiries(updated);
    onPersistState({ enquiries: updated });
    if (isGoogleAdmin) {
      try {
        await updateDoc(doc(db, 'enquiries', enquiry.id), { status: newStatus });
      } catch {
        // Handled by local & server store
      }
    }
    showNotice('success', `Enquiry for ${enquiry.fullName} updated to "${newStatus}".`);
  };

  const handleDeleteEnquiry = async (id: string) => {
    const updated = enquiries.filter((e) => e.id !== id);
    setEnquiries(updated);
    onPersistState({ enquiries: updated });
    if (isGoogleAdmin) {
      try {
        await deleteDoc(doc(db, 'enquiries', id));
      } catch {
        // Handled by local & server store
      }
    }
    showNotice('success', 'Order enquiry deleted.');
  };

  const handleSaveCollectionItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!colForm.title.trim() || !colForm.description.trim() || !colForm.imageUrl.trim()) {
      showNotice('error', 'Please provide outfit title, description, and photograph.');
      return;
    }
    const id = editingCollectionId || `col-${Date.now()}`;
    const existingItem = collections.find((c) => c.id === id);
    const newItem: CollectionItem = {
      id,
      title: colForm.title.trim().slice(0, 120),
      category: colForm.category.trim().slice(0, 80),
      description: colForm.description.trim().slice(0, 1000),
      imageUrl: colForm.imageUrl.trim().slice(0, 800000),
      priceEstimate: colForm.priceEstimate.trim().slice(0, 60) || 'Custom Quote',
      featured: Boolean(colForm.featured),
      createdAt: existingItem?.createdAt || new Date().toISOString(),
    };

    const updated = editingCollectionId
      ? collections.map((c) => (c.id === id ? newItem : c))
      : [newItem, ...collections];

    setCollections(updated);
    onPersistState({ collections: updated });

    if (isGoogleAdmin) {
      try {
        const { id: _id, ...payload } = newItem;
        await setDoc(doc(db, 'collections', id), payload);
      } catch {
        // Handled by local & server store
      }
    }

    setEditingCollectionId(null);
    setColForm({
      title: '',
      category: 'Aso-Ebi',
      description: '',
      imageUrl: '',
      priceEstimate: 'From ₦75,000',
      featured: true,
    });
    showNotice('success', editingCollectionId ? 'Outfit updated in collection.' : 'New outfit added to collection.');
  };

  const handleDeleteCollectionItem = async (id: string) => {
    const updated = collections.filter((c) => c.id !== id);
    setCollections(updated);
    onPersistState({ collections: updated });
    if (isGoogleAdmin) {
      try {
        await deleteDoc(doc(db, 'collections', id));
      } catch {
        // Handled by local & server store
      }
    }
    showNotice('success', 'Outfit removed from collection.');
  };

  const handleSaveServiceItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!srvForm.title.trim() || !srvForm.description.trim() || !srvForm.imageUrl.trim()) {
      showNotice('error', 'Please complete all service fields and photograph.');
      return;
    }
    const id = editingServiceId || `srv-${Date.now()}`;
    const newItem: ServiceItem = {
      id,
      title: srvForm.title.trim().slice(0, 120),
      description: srvForm.description.trim().slice(0, 1000),
      imageUrl: srvForm.imageUrl.trim().slice(0, 800000),
      startingPrice: srvForm.startingPrice.trim().slice(0, 60),
      turnaroundTime: srvForm.turnaroundTime.trim().slice(0, 80),
    };

    const updated = editingServiceId
      ? services.map((s) => (s.id === id ? newItem : s))
      : [...services, newItem];

    setServices(updated);
    onPersistState({ services: updated });

    if (isGoogleAdmin) {
      try {
        const { id: _id, ...payload } = newItem;
        await setDoc(doc(db, 'services', id), payload);
      } catch {
        // Handled by local & server store
      }
    }

    setEditingServiceId(null);
    setSrvForm({
      title: '',
      description: '',
      imageUrl: '',
      startingPrice: 'From ₦45,000',
      turnaroundTime: '7–14 Working Days',
    });
    showNotice('success', 'Service saved.');
  };

  const handleDeleteServiceItem = async (id: string) => {
    const updated = services.filter((s) => s.id !== id);
    setServices(updated);
    onPersistState({ services: updated });
    if (isGoogleAdmin) {
      try {
        await deleteDoc(doc(db, 'services', id));
      } catch {
        // Handled by local & server store
      }
    }
    showNotice('success', 'Service removed.');
  };

  const handleSaveGalleryPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!galForm.caption.trim() || !galForm.imageUrl.trim()) {
      showNotice('error', 'Please provide a caption and upload a photograph.');
      return;
    }
    const id = `gal-${Date.now()}`;
    const newPhoto: GalleryPhoto = {
      id,
      caption: galForm.caption.trim().slice(0, 200),
      category: galForm.category.trim().slice(0, 80),
      imageUrl: galForm.imageUrl.trim().slice(0, 800000),
      featured: Boolean(galForm.featured),
      createdAt: new Date().toISOString(),
    };

    const updated = [newPhoto, ...gallery];
    setGallery(updated);
    onPersistState({ gallery: updated });

    if (isGoogleAdmin) {
      try {
        const { id: _id, ...payload } = newPhoto;
        await setDoc(doc(db, 'gallery', id), payload);
      } catch {
        // Handled by local & server store
      }
    }

    setGalForm({
      caption: '',
      category: 'Aso-Ebi',
      imageUrl: '',
      featured: true,
    });
    showNotice('success', 'Photograph published to portfolio gallery.');
  };

  const handleDeleteGalleryPhoto = async (id: string) => {
    const updated = gallery.filter((g) => g.id !== id);
    setGallery(updated);
    onPersistState({ gallery: updated });
    if (isGoogleAdmin) {
      try {
        await deleteDoc(doc(db, 'gallery', id));
      } catch {
        // Handled by local & server store
      }
    }
    showNotice('success', 'Gallery photograph removed.');
  };

  const handleToggleTestimonialApproval = async (review: Testimonial) => {
    const updated = testimonials.map((t) =>
      t.id === review.id ? { ...t, approved: !t.approved } : t
    );
    setTestimonials(updated);
    onPersistState({ testimonials: updated });

    if (isGoogleAdmin) {
      try {
        await updateDoc(doc(db, 'testimonials', review.id), {
          approved: !review.approved,
          customerName: review.customerName,
          roleOrOccasion: review.roleOrOccasion,
          review: review.review,
          rating: review.rating,
        });
      } catch {
        // Handled by local & server store
      }
    }

    showNotice(
      'success',
      !review.approved
        ? `Approved review by ${review.customerName}.`
        : `Unpublished review by ${review.customerName}.`
    );
  };

  const handleDeleteTestimonial = async (id: string) => {
    const updated = testimonials.filter((t) => t.id !== id);
    setTestimonials(updated);
    onPersistState({ testimonials: updated });
    if (isGoogleAdmin) {
      try {
        await deleteDoc(doc(db, 'testimonials', id));
      } catch {
        // Handled by local & server store
      }
    }
    showNotice('success', 'Testimonial deleted.');
  };

  const handleDeleteContactMessage = (id: string) => {
    const updated = contactMessages.filter((m) => m.id !== id);
    setContactMessages(updated);
    onPersistState({ contactMessages: updated });
    showNotice('success', 'Contact message removed.');
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: SiteSettings = {
      whatsappNumber: settingsForm.whatsappNumber.trim().slice(0, 40),
      altPhoneNumber: settingsForm.altPhoneNumber.trim().slice(0, 40),
      address: settingsForm.address.trim().slice(0, 250),
      openingHours: settingsForm.openingHours.trim().slice(0, 500),
      instagramUrl: settingsForm.instagramUrl.trim().slice(0, 250),
      facebookUrl: settingsForm.facebookUrl.trim().slice(0, 250),
      heroHeadline: settingsForm.heroHeadline.trim().slice(0, 150),
      heroSubtext: settingsForm.heroSubtext.trim().slice(0, 500),
      deliveryPolicy: settingsForm.deliveryPolicy.trim().slice(0, 2000),
      updatedAt: new Date().toISOString(),
    };
    setSettings(payload);
    onPersistState({ settings: payload });
    if (isGoogleAdmin) {
      try {
        await setDoc(doc(db, 'settings', 'global'), payload);
      } catch {
        // Handled by local & server store
      }
    }
    showNotice('success', 'Business settings, opening hours, and policies updated.');
  };

  // Unauthenticated View -> Password Login (eucharia2026) + Google Sign-In
  if (!isAuthorizedAdmin) {
    return (
      <section className="max-w-md mx-auto px-6 py-16">
        <div className="bg-white border border-[#C5A059] rounded-2xl p-8 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-[#1A1412] text-[#C5A059] flex items-center justify-center mx-auto mb-4 font-serif-display text-xl tracking-widest">
            ES
          </div>
          <div className="text-center">
            <p className="text-xs text-[#9E7B36] font-medium">
              EUCHARIA Stitches · Secure Studio Access
            </p>
            <h1 className="font-serif-display text-3xl font-semibold text-[#1A1412] mt-1">
              Administrator Login
            </h1>
            <p className="text-xs text-[#5C4E47] mt-1.5 leading-relaxed">
              Enter your studio administrator password to manage customer order enquiries, outfit
              collections, fabric library, gallery photos, and business settings.
            </p>
          </div>

          {authError && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 text-center">
              {authError}
            </div>
          )}

          <form onSubmit={handlePasswordLogin} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1A1412] mb-1.5">
                Administrator Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#9E7B36] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter admin password..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg text-[#1A1412] focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-[#1A1412] text-[#FAF7F2] text-xs font-semibold rounded-lg hover:bg-[#2C211D] transition-colors flex items-center justify-center gap-2"
            >
              <Lock className="w-3.5 h-3.5 text-[#C5A059]" />
              Unlock Admin Dashboard
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#E6DEC8] flex flex-col gap-2.5">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 border border-[#E6DEC8] text-[#1A1412] text-xs font-medium rounded-lg hover:bg-[#FAF7F2] transition-colors"
            >
              Or Sign In with Admin Google Account
            </button>
            <button
              type="button"
              onClick={onCloseAdmin}
              className="w-full py-2 text-xs text-[#5C4E47] hover:text-[#1A1412] transition-colors"
            >
              ← Return to Public Showroom
            </button>
          </div>
        </div>
      </section>
    );
  }

  const newEnquiriesCount = enquiries.filter((e) => e.status === 'New').length;
  const pendingReviewsCount = testimonials.filter((t) => !t.approved).length;

  return (
    <section className="max-w-7xl mx-auto px-6 py-10">
      {/* Top Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E6DEC8]">
        <div>
          <p className="text-xs text-[#9E7B36] font-medium">
            EUCHARIA Stitches · Atelier Control Center
          </p>
          <h1 className="font-serif-display text-3xl md:text-4xl font-semibold text-[#1A1412] mt-0.5">
            Administrator Dashboard
          </h1>
          <p className="text-xs text-[#5C4E47] mt-0.5">
            Authenticated as Studio Administrator ({user?.email || 'ezehaustine1@gmail.com'})
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleResetDefaultCatalog}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#C5A059] text-[#1A1412] bg-[#FAF7F2] hover:bg-[#F5EFE6] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#9E7B36]" />
            Restore Default Catalog
          </button>
          <button
            onClick={onCloseAdmin}
            className="px-3.5 py-2 border border-[#E6DEC8] text-[#1A1412] hover:bg-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            View Live Website
          </button>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1A1412] text-[#FAF7F2] hover:bg-[#2C211D] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <LogOut className="w-3.5 h-3.5 text-[#C5A059]" />
            Lock Dashboard
          </button>
        </div>
      </div>

      {/* Activity & Enquiry Statistics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 py-5 border-b border-[#E6DEC8]">
        <div className="bg-white p-3.5 rounded-lg border border-[#E6DEC8]">
          <p className="text-xs text-[#5C4E47]">Total Enquiries</p>
          <p className="font-mono-num text-2xl font-semibold text-[#1A1412] mt-0.5">
            {enquiries.length}
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-[#E6DEC8]">
          <p className="text-xs text-[#5C4E47]">New Orders</p>
          <p className="font-mono-num text-2xl font-semibold text-[#9E7B36] mt-0.5">
            {newEnquiriesCount}
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-[#E6DEC8]">
          <p className="text-xs text-[#5C4E47]">Collections</p>
          <p className="font-mono-num text-2xl font-semibold text-[#1A1412] mt-0.5">
            {collections.length}
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-[#E6DEC8]">
          <p className="text-xs text-[#5C4E47]">Gallery Photos</p>
          <p className="font-mono-num text-2xl font-semibold text-[#1A1412] mt-0.5">
            {gallery.length}
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-[#E6DEC8]">
          <p className="text-xs text-[#5C4E47]">Pending Reviews</p>
          <p className="font-mono-num text-2xl font-semibold text-[#1A1412] mt-0.5">
            {pendingReviewsCount}
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-[#E6DEC8]">
          <p className="text-xs text-[#5C4E47]">Subscribers</p>
          <p className="font-mono-num text-2xl font-semibold text-[#1A1412] mt-0.5">
            {subscribersCount}
          </p>
        </div>
      </div>

      {statusBanner && (
        <div
          className={`mt-5 p-3.5 rounded-lg border text-xs font-medium ${
            statusBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          {statusBanner.text}
        </div>
      )}

      {/* Segmented Admin Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1.5 bg-[#F5EFE6] rounded-xl mt-5 border border-[#E6DEC8]">
        {[
          { id: 'enquiries', label: `Order Enquiries (${enquiries.length})`, icon: ShoppingBag },
          { id: 'emails', label: `Email Notifications (${enquiries.length})`, icon: Mail },
          { id: 'collections', label: `Collections (${collections.length})`, icon: Scissors },
          { id: 'services', label: `Services (${services.length})`, icon: Edit3 },
          { id: 'gallery', label: `Gallery (${gallery.length})`, icon: ImageIcon },
          { id: 'testimonials', label: `Reviews (${testimonials.length})`, icon: Star },
          { id: 'messages', label: `Contact Inbox (${contactMessages.length})`, icon: MessageCircle },
          { id: 'settings', label: 'Studio Settings & Hours', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-[#1A1412] text-[#FAF7F2]'
                  : 'text-[#5C4E47] hover:text-[#1A1412]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: ORDER ENQUIRIES */}
      {activeTab === 'enquiries' && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif-display text-2xl font-semibold text-[#1A1412]">
              Customer Order & Appointment Enquiries
            </h2>
          </div>
          {enquiries.length === 0 ? (
            <div className="bg-white border border-[#E6DEC8] rounded-xl p-10 text-center">
              <p className="text-sm text-[#5C4E47]">
                No customer order enquiries submitted yet. New bookings submitted on the website will appear here immediately.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {enquiries.map((enq) => (
                <div
                  key={enq.id}
                  className="bg-white border border-[#E6DEC8] rounded-xl p-5 flex flex-col lg:flex-row justify-between gap-5"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#5C4E47]">
                      <span className="font-semibold text-[#1A1412] text-sm">
                        {enq.fullName}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>Status: {enq.status}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-num">
                        Ref: ES-{String(enq.id).slice(-6).toUpperCase()}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-num">
                        {new Date(enq.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="font-serif-display text-xl font-semibold text-[#1A1412]">
                      {enq.outfitType} — {enq.category}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs text-[#5C4E47] pt-1">
                      <div>
                        <strong className="text-[#1A1412]">Phone:</strong>{' '}
                        <span className="font-mono-num">{enq.phone}</span>
                      </div>
                      <div>
                        <strong className="text-[#1A1412]">WhatsApp:</strong>{' '}
                        <span className="font-mono-num">{enq.whatsapp}</span>
                      </div>
                      <div>
                        <strong className="text-[#1A1412]">Email:</strong>{' '}
                        {enq.email || 'Not provided'}
                      </div>
                      <div>
                        <strong className="text-[#1A1412]">Occasion:</strong> {enq.occasion}
                      </div>
                      <div>
                        <strong className="text-[#1A1412]">Preferred Fabric:</strong>{' '}
                        {enq.preferredFabric || 'Not specified'}
                      </div>
                      <div>
                        <strong className="text-[#1A1412]">Preferred Colour:</strong>{' '}
                        {enq.preferredColor}
                      </div>
                      <div>
                        <strong className="text-[#1A1412]">Appointment Date:</strong>{' '}
                        <span className="font-mono-num">{enq.appointmentDate}</span>
                      </div>
                      <div>
                        <strong className="text-[#1A1412]">Required Delivery:</strong>{' '}
                        <span className="font-mono-num">{enq.deliveryDate}</span>
                      </div>
                    </div>
                    {enq.instructions && (
                      <p className="text-xs text-[#1A1412] bg-[#FAF7F2] p-3 rounded-lg border border-[#E6DEC8] mt-2">
                        <strong>Additional Notes:</strong> {enq.instructions}
                      </p>
                    )}
                  </div>

                  {enq.inspirationImage && (
                    <div className="w-28 h-36 shrink-0 rounded-lg overflow-hidden border border-[#E6DEC8]">
                      <ResilientImage
                        src={enq.inspirationImage}
                        alt={`Inspiration uploaded by ${enq.fullName}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex flex-col justify-between items-start lg:items-end gap-3 shrink-0">
                    <div className="flex flex-col gap-1 w-full lg:w-auto">
                      <label className="text-[11px] text-[#5C4E47] font-medium">
                        Update Status
                      </label>
                      <select
                        value={enq.status}
                        onChange={(e) =>
                          handleEnquiryStatusChange(
                            enq,
                            e.target.value as OrderEnquiry['status']
                          )
                        }
                        className="px-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg text-[#1A1412] font-medium"
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => downloadOrderEnquiryPdf(enq, settings)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#C5A059] text-[#1A1412] bg-[#FAF7F2] hover:bg-[#F5EFE6] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0"
                      >
                        <FileDown className="w-3.5 h-3.5 text-[#9E7B36]" />
                        PDF Dossier
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewEmailEnquiry(enq)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#E6DEC8] text-[#1A1412] hover:bg-[#FAF7F2] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#9E7B36]" />
                        View Emails
                      </button>
                      <a
                        href={getWhatsAppLink(
                          `Hello ${enq.fullName}, this is EUCHARIA Stitches regarding your ${enq.outfitType} (${enq.category}) enquiry for ${enq.occasion}.`,
                          enq.whatsapp
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1412] text-[#FAF7F2] text-xs font-medium rounded-lg hover:bg-[#2C211D] transition-colors whitespace-nowrap shrink-0"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-[#C5A059]" />
                        WhatsApp
                      </a>
                      <button
                        onClick={() => handleDeleteEnquiry(enq.id)}
                        className="p-1.5 text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Enquiry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EMAIL NOTIFICATIONS LOG */}
      {activeTab === 'emails' && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-serif-display text-2xl font-semibold text-[#1A1412]">
                Automated Client & Admin Order Emails
              </h2>
              <p className="text-xs text-[#5C4E47]">
                Every order enquiry generates a formatted Client Confirmation Email and an Admin Studio Alert Email.
              </p>
            </div>
          </div>

          {enquiries.length === 0 ? (
            <div className="bg-white border border-[#E6DEC8] rounded-xl p-8 text-center text-sm text-[#5C4E47]">
              No order emails dispatched yet. Submit an order enquiry on the "Book an Appointment" page to view generated emails.
            </div>
          ) : (
            <div className="space-y-4">
              {enquiries.map((enq) => {
                const emailData = buildProfessionalEmails(enq, settings);
                return (
                  <div
                    key={enq.id}
                    className="bg-white border border-[#E6DEC8] rounded-xl p-5 space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6DEC8] pb-3">
                      <div>
                        <span className="text-xs font-mono-num text-[#9E7B36] font-semibold">
                          {emailData.refNumber}
                        </span>
                        <h3 className="font-serif-display text-xl font-semibold text-[#1A1412]">
                          {enq.fullName} — {enq.outfitType} ({enq.category})
                        </h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {enq.email && (
                          <a
                            href={`mailto:${enq.email}?subject=${encodeURIComponent(
                              emailData.clientEmailSubject
                            )}&body=${encodeURIComponent(emailData.clientEmailBodyText)}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1412] text-[#FAF7F2] text-xs font-medium rounded-lg hover:bg-[#2C211D]"
                          >
                            <Mail className="w-3.5 h-3.5 text-[#C5A059]" />
                            Send Client Email ({enq.email})
                          </a>
                        )}
                        <a
                          href={`mailto:${BOOTSTRAPPED_ADMIN_EMAIL}?subject=${encodeURIComponent(
                            emailData.adminEmailSubject
                          )}&body=${encodeURIComponent(emailData.adminEmailBodyText)}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#C5A059] text-[#1A1412] text-xs font-medium rounded-lg hover:bg-[#FAF7F2]"
                        >
                          <Mail className="w-3.5 h-3.5 text-[#9E7B36]" />
                          Forward to Admin Email
                        </a>
                        <button
                          type="button"
                          onClick={() => downloadOrderEnquiryPdf(enq, settings)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#E6DEC8] text-[#1A1412] text-xs font-medium rounded-lg hover:bg-[#FAF7F2]"
                        >
                          <FileDown className="w-3.5 h-3.5 text-[#9E7B36]" />
                          Download PDF
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E6DEC8]">
                        <p className="text-xs font-semibold text-[#9E7B36] mb-2">
                          Client Confirmation Email Preview (To: {enq.email || enq.whatsapp})
                        </p>
                        <pre className="text-[11px] text-[#1A1412] whitespace-pre-wrap font-sans-body leading-relaxed max-h-56 overflow-y-auto">
                          {emailData.clientEmailBodyText}
                        </pre>
                      </div>
                      <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E6DEC8]">
                        <p className="text-xs font-semibold text-[#9E7B36] mb-2">
                          Admin Studio Alert Email Preview (To: {BOOTSTRAPPED_ADMIN_EMAIL})
                        </p>
                        <pre className="text-[11px] text-[#1A1412] whitespace-pre-wrap font-sans-body leading-relaxed max-h-56 overflow-y-auto">
                          {emailData.adminEmailBodyText}
                        </pre>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COLLECTIONS MANAGEMENT (5-in-a-row compact layout) */}
      {activeTab === 'collections' && (
        <div className="mt-6 space-y-8">
          <form
            onSubmit={handleSaveCollectionItem}
            className="bg-white border border-[#E6DEC8] rounded-xl p-6 space-y-4"
          >
            <h3 className="font-serif-display text-2xl font-semibold text-[#1A1412]">
              {editingCollectionId ? 'Edit Outfit Design' : 'Add New Outfit to Showroom Collection'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#1A1412] mb-1">
                  Outfit Name / Design Title *
                </label>
                <input
                  type="text"
                  required
                  value={colForm.title}
                  onChange={(e) => setColForm({ ...colForm, title: e.target.value })}
                  placeholder="e.g. Royal Champagne Lace Corset Gown"
                  className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#1A1412] mb-1">
                  Category *
                </label>
                <select
                  value={colForm.category}
                  onChange={(e) => setColForm({ ...colForm, category: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg"
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
                  Starting Price Indicator (₦) *
                </label>
                <input
                  type="text"
                  required
                  value={colForm.priceEstimate}
                  onChange={(e) => setColForm({ ...colForm, priceEstimate: e.target.value })}
                  placeholder="e.g. From ₦85,000"
                  className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#1A1412] mb-1">
                  Description *
                </label>
                <textarea
                  rows={2}
                  required
                  value={colForm.description}
                  onChange={(e) => setColForm({ ...colForm, description: e.target.value })}
                  placeholder="Describe fabric, silhouette, and occasion..."
                  className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#1A1412] mb-1">
                  Upload Outfit Photograph *
                </label>
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#F5EFE6] border border-[#E6DEC8] rounded-lg text-xs font-medium cursor-pointer hover:bg-[#E6DEC8]/50 transition-colors shrink-0">
                    <Upload className="w-3.5 h-3.5 text-[#9E7B36]" />
                    {isUploading ? 'Processing...' : 'Choose Image File'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setIsUploading(true);
                        try {
                          const dataUrl = await compressImageFile(file);
                          setColForm((prev) => ({ ...prev, imageUrl: dataUrl }));
                        } catch {
                          showNotice('error', 'Could not process image file.');
                        } finally {
                          setIsUploading(false);
                        }
                      }}
                    />
                  </label>
                  <input
                    type="text"
                    value={colForm.imageUrl}
                    onChange={(e) => setColForm({ ...colForm, imageUrl: e.target.value })}
                    placeholder="Or paste image URL..."
                    className="flex-1 px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <label className="flex items-center gap-2 text-xs text-[#1A1412] cursor-pointer">
                <input
                  type="checkbox"
                  checked={colForm.featured}
                  onChange={(e) => setColForm({ ...colForm, featured: e.target.checked })}
                />
                Feature on Homepage Spotlight
              </label>
              <div className="flex items-center gap-2">
                {editingCollectionId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCollectionId(null);
                      setColForm({
                        title: '',
                        category: 'Aso-Ebi',
                        description: '',
                        imageUrl: '',
                        priceEstimate: 'From ₦75,000',
                        featured: true,
                      });
                    }}
                    className="px-4 py-2 border border-[#E6DEC8] text-xs rounded-lg"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#1A1412] text-[#FAF7F2] text-xs font-medium rounded-lg hover:bg-[#2C211D] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {editingCollectionId ? 'Save Changes' : 'Add to Collection'}
                </button>
              </div>
            </div>
          </form>

          {/* 5-in-a-Row Admin Collections Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {collections.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-[#E6DEC8] rounded-xl overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="h-44 w-full overflow-hidden bg-[#F5EFE6]">
                    <ResilientImage
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3.5">
                    <p className="text-[11px] text-[#9E7B36] font-medium truncate">
                      {item.category} · <span className="font-mono-num">{item.priceEstimate}</span>
                    </p>
                    <h4 className="font-serif-display text-base font-semibold text-[#1A1412] mt-0.5 line-clamp-1">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-[#5C4E47] mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </div>
                <div className="px-3.5 pb-3 pt-2 border-t border-[#E6DEC8] flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setEditingCollectionId(item.id);
                      setColForm({
                        title: item.title,
                        category: item.category,
                        description: item.description,
                        imageUrl: item.imageUrl,
                        priceEstimate: item.priceEstimate,
                        featured: item.featured,
                      });
                    }}
                    className="text-[11px] font-medium text-[#1A1412] hover:text-[#9E7B36]"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCollectionItem(item.id)}
                    className="text-[11px] font-medium text-red-700 hover:underline inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SERVICES MANAGEMENT */}
      {activeTab === 'services' && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form
            onSubmit={handleSaveServiceItem}
            className="bg-white border border-[#E6DEC8] rounded-xl p-6 space-y-4 h-fit"
          >
            <h3 className="font-serif-display text-2xl font-semibold text-[#1A1412]">
              {editingServiceId ? 'Edit Service' : 'Add Service'}
            </h3>
            <div>
              <label className="block text-xs font-medium text-[#1A1412] mb-1">
                Service Title *
              </label>
              <input
                type="text"
                required
                value={srvForm.title}
                onChange={(e) => setSrvForm({ ...srvForm, title: e.target.value })}
                placeholder="e.g. Bespoke Bridal Couture"
                className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1A1412] mb-1">
                Starting Price (₦) *
              </label>
              <input
                type="text"
                required
                value={srvForm.startingPrice}
                onChange={(e) => setSrvForm({ ...srvForm, startingPrice: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1A1412] mb-1">
                Turnaround Timeframe *
              </label>
              <input
                type="text"
                required
                value={srvForm.turnaroundTime}
                onChange={(e) => setSrvForm({ ...srvForm, turnaroundTime: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1A1412] mb-1">
                Service Description *
              </label>
              <textarea
                rows={3}
                required
                value={srvForm.description}
                onChange={(e) => setSrvForm({ ...srvForm, description: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1A1412] mb-1">
                Service Image *
              </label>
              <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#F5EFE6] border border-[#E6DEC8] rounded-lg text-xs font-medium cursor-pointer hover:bg-[#E6DEC8]/50 transition-colors">
                <Upload className="w-3.5 h-3.5 text-[#9E7B36]" />
                Upload Photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const dataUrl = await compressImageFile(file);
                    setSrvForm((prev) => ({ ...prev, imageUrl: dataUrl }));
                  }}
                />
              </label>
              <input
                type="text"
                value={srvForm.imageUrl}
                onChange={(e) => setSrvForm({ ...srvForm, imageUrl: e.target.value })}
                placeholder="Or paste image URL..."
                className="w-full mt-2 px-3.5 py-2 text-xs bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg"
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2.5 bg-[#1A1412] text-[#FAF7F2] text-xs font-medium rounded-lg hover:bg-[#2C211D] transition-colors"
            >
              {editingServiceId ? 'Update Service' : 'Add Service'}
            </button>
          </form>

          <div className="lg:col-span-2 space-y-3">
            {services.map((srv) => (
              <div
                key={srv.id}
                className="bg-white border border-[#E6DEC8] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-[#E6DEC8]">
                    <ResilientImage
                      src={srv.imageUrl}
                      alt={srv.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-serif-display text-lg font-semibold text-[#1A1412]">
                      {srv.title}
                    </h4>
                    <p className="text-xs text-[#9E7B36] font-mono-num">
                      {srv.startingPrice} · {srv.turnaroundTime}
                    </p>
                    <p className="text-xs text-[#5C4E47] mt-0.5">{srv.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => {
                      setEditingServiceId(srv.id);
                      setSrvForm({
                        title: srv.title,
                        description: srv.description,
                        imageUrl: srv.imageUrl,
                        startingPrice: srv.startingPrice,
                        turnaroundTime: srv.turnaroundTime,
                      });
                    }}
                    className="text-xs font-medium text-[#1A1412] hover:text-[#9E7B36]"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteServiceItem(srv.id)}
                    className="text-xs font-medium text-red-700 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: GALLERY MANAGEMENT (5-in-a-row grid) */}
      {activeTab === 'gallery' && (
        <div className="mt-6 space-y-6">
          <form
            onSubmit={handleSaveGalleryPhoto}
            className="bg-white border border-[#E6DEC8] rounded-xl p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
          >
            <div>
              <label className="block text-xs font-medium text-[#1A1412] mb-1">
                Short Caption *
              </label>
              <input
                type="text"
                required
                value={galForm.caption}
                onChange={(e) => setGalForm({ ...galForm, caption: e.target.value })}
                placeholder="e.g. Gold Beaded Reception Gown"
                className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1A1412] mb-1">
                Category *
              </label>
              <select
                value={galForm.category}
                onChange={(e) => setGalForm({ ...galForm, category: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg"
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
                Photograph File or URL *
              </label>
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#F5EFE6] border border-[#E6DEC8] rounded-lg text-xs font-medium cursor-pointer hover:bg-[#E6DEC8]/50 shrink-0">
                  <Upload className="w-3.5 h-3.5 text-[#9E7B36]" />
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const dataUrl = await compressImageFile(file);
                      setGalForm((prev) => ({ ...prev, imageUrl: dataUrl }));
                    }}
                  />
                </label>
                <input
                  type="text"
                  value={galForm.imageUrl}
                  onChange={(e) => setGalForm({ ...galForm, imageUrl: e.target.value })}
                  placeholder="Or URL..."
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg"
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-[#1A1412] text-[#FAF7F2] text-xs font-medium rounded-lg hover:bg-[#2C211D] transition-colors"
            >
              Publish to Gallery
            </button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {gallery.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-[#E6DEC8] rounded-xl overflow-hidden flex flex-col justify-between"
              >
                <div className="h-44 w-full overflow-hidden">
                  <ResilientImage
                    src={item.imageUrl}
                    alt={item.caption}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] text-[#9E7B36] truncate">{item.category}</p>
                    <p className="text-xs font-medium text-[#1A1412] mt-0.5 line-clamp-2">
                      {item.caption}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteGalleryPhoto(item.id)}
                    className="p-1.5 text-red-700 hover:bg-red-50 rounded-lg shrink-0"
                    title="Delete Photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: TESTIMONIALS MODERATION */}
      {activeTab === 'testimonials' && (
        <div className="mt-6 space-y-4">
          <h3 className="font-serif-display text-2xl font-semibold text-[#1A1412]">
            Customer Reviews & Approval Queue
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testimonials.map((rev) => (
              <div
                key={rev.id}
                className="bg-white border border-[#E6DEC8] rounded-xl p-5 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-[#5C4E47]">
                    <span className="font-semibold text-[#1A1412] text-sm">
                      {rev.customerName}
                    </span>
                    <span>
                      {rev.approved ? 'Published' : 'Pending Approval'}
                    </span>
                  </div>
                  <p className="text-xs text-[#9E7B36] mt-0.5">{rev.roleOrOccasion}</p>
                  <p className="text-xs text-[#1A1412] mt-2.5 leading-relaxed">
                    "{rev.review}"
                  </p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#E6DEC8]">
                  <button
                    onClick={() => handleToggleTestimonialApproval(rev)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      rev.approved
                        ? 'border border-[#E6DEC8] text-[#5C4E47] hover:bg-[#FAF7F2]'
                        : 'bg-[#1A1412] text-[#FAF7F2] hover:bg-[#2C211D]'
                    }`}
                  >
                    {rev.approved ? (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A059]" />
                        Approve & Publish
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteTestimonial(rev.id)}
                    className="text-xs text-red-700 hover:underline inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: CONTACT MESSAGES */}
      {activeTab === 'messages' && (
        <div className="mt-6 space-y-4">
          <h3 className="font-serif-display text-2xl font-semibold text-[#1A1412]">
            Direct Contact Form Messages
          </h3>
          {contactMessages.length === 0 ? (
            <div className="bg-white border border-[#E6DEC8] rounded-xl p-8 text-center text-sm text-[#5C4E47]">
              No contact messages received yet.
            </div>
          ) : (
            <div className="space-y-3">
              {contactMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="bg-white border border-[#E6DEC8] rounded-xl p-5 flex flex-col sm:flex-row justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 text-xs text-[#5C4E47]">
                      <span className="font-semibold text-[#1A1412]">{msg.name}</span>
                      <span>·</span>
                      <span className="font-mono-num">{msg.phone}</span>
                      {msg.email && (
                        <>
                          <span>·</span>
                          <span>{msg.email}</span>
                        </>
                      )}
                    </div>
                    <h4 className="font-serif-display text-lg font-semibold text-[#1A1412] mt-1">
                      {msg.subject}
                    </h4>
                    <p className="text-sm text-[#5C4E47] mt-1">{msg.message}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={getWhatsAppLink(
                        `Hello ${msg.name}, thank you for contacting EUCHARIA Stitches regarding "${msg.subject}".`,
                        msg.phone
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-[#1A1412] text-[#FAF7F2] text-xs font-medium rounded-lg whitespace-nowrap shrink-0"
                    >
                      Reply on WhatsApp
                    </a>
                    <button
                      onClick={() => handleDeleteContactMessage(msg.id)}
                      className="p-2 text-red-700 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 8: BUSINESS SETTINGS & HOURS */}
      {activeTab === 'settings' && (
        <form
          onSubmit={handleSaveSettings}
          className="mt-6 bg-white border border-[#E6DEC8] rounded-xl p-6 max-w-3xl space-y-4"
        >
          <h3 className="font-serif-display text-2xl font-semibold text-[#1A1412]">
            Business Information, Studio Hours & Policies
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#1A1412] mb-1">
                Primary WhatsApp Number
              </label>
              <input
                type="text"
                required
                value={settingsForm.whatsappNumber}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })
                }
                className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg font-mono-num"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1A1412] mb-1">
                Alternative Phone Number
              </label>
              <input
                type="text"
                required
                value={settingsForm.altPhoneNumber}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, altPhoneNumber: e.target.value })
                }
                className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg font-mono-num"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#1A1412] mb-1">
              Showroom & Studio Address
            </label>
            <input
              type="text"
              required
              value={settingsForm.address}
              onChange={(e) =>
                setSettingsForm({ ...settingsForm, address: e.target.value })
              }
              className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#1A1412] mb-1">
              Business Opening Hours
            </label>
            <input
              type="text"
              required
              value={settingsForm.openingHours}
              onChange={(e) =>
                setSettingsForm({ ...settingsForm, openingHours: e.target.value })
              }
              className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#1A1412] mb-1">
                Instagram URL
              </label>
              <input
                type="url"
                value={settingsForm.instagramUrl}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, instagramUrl: e.target.value })
                }
                className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1A1412] mb-1">
                Facebook URL
              </label>
              <input
                type="url"
                value={settingsForm.facebookUrl}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, facebookUrl: e.target.value })
                }
                className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#1A1412] mb-1">
              Homepage Hero Headline
            </label>
            <input
              type="text"
              required
              value={settingsForm.heroHeadline}
              onChange={(e) =>
                setSettingsForm({ ...settingsForm, heroHeadline: e.target.value })
              }
              className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#1A1412] mb-1">
              Homepage Hero Supporting Text
            </label>
            <textarea
              rows={2}
              required
              value={settingsForm.heroSubtext}
              onChange={(e) =>
                setSettingsForm({ ...settingsForm, heroSubtext: e.target.value })
              }
              className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#1A1412] mb-1">
              Delivery & Studio Collection Policy
            </label>
            <textarea
              rows={3}
              required
              value={settingsForm.deliveryPolicy}
              onChange={(e) =>
                setSettingsForm({ ...settingsForm, deliveryPolicy: e.target.value })
              }
              className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#1A1412] text-[#FAF7F2] text-xs font-medium rounded-lg hover:bg-[#2C211D] transition-colors"
          >
            Save All Studio Settings
          </button>
        </form>
      )}

      {/* Email Preview Modal */}
      {previewEmailEnquiry && (
        <div
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
          onClick={() => setPreviewEmailEnquiry(null)}
        >
          <div
            className="bg-white border border-[#C5A059] rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const emailInfo = buildProfessionalEmails(previewEmailEnquiry, settings);
              return (
                <>
                  <div className="flex items-center justify-between border-b border-[#E6DEC8] pb-3">
                    <div>
                      <p className="text-xs text-[#9E7B36] font-mono-num">
                        {emailInfo.refNumber}
                      </p>
                      <h3 className="font-serif-display text-2xl font-semibold text-[#1A1412]">
                        Client & Admin Email Dossier — {previewEmailEnquiry.fullName}
                      </h3>
                    </div>
                    <button
                      onClick={() => setPreviewEmailEnquiry(null)}
                      className="px-3 py-1.5 text-xs border border-[#E6DEC8] rounded-lg"
                    >
                      Close
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E6DEC8]">
                      <p className="text-xs font-semibold text-[#1A1412] mb-2">
                        1. Client Confirmation Email
                      </p>
                      <div
                        className="text-xs"
                        dangerouslySetInnerHTML={{ __html: emailInfo.clientEmailHtml }}
                      />
                    </div>
                    <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E6DEC8]">
                      <p className="text-xs font-semibold text-[#1A1412] mb-2">
                        2. Admin Notification Email
                      </p>
                      <div
                        className="text-xs"
                        dangerouslySetInnerHTML={{ __html: emailInfo.adminEmailHtml }}
                      />
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </section>
  );
};
