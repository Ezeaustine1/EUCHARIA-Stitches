export const BRAND_IMAGES = {
  heroCouture: '/src/assets/images/hero_nigerian_couture_1794315053157.jpg',
  atelierStudio: '/src/assets/images/atelier_craftsmanship_studio_1794315050886.jpg',
  asoEbiLace: '/src/assets/images/collection_aso_ebi_lace_1794315051320.jpg',
  ankaraContemporary: '/src/assets/images/collection_ankara_contemporary_1794315053123.jpg',
  bridalCouture: '/src/assets/images/collection_bridal_corporate_1794315053276.jpg',
};

export interface CollectionItem {
  id: string;
  title: string;
  category: string;
  description: string;
  imageUrl: string;
  priceEstimate: string;
  featured: boolean;
  createdAt: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  startingPrice: string;
  turnaroundTime: string;
}

export interface GalleryPhoto {
  id: string;
  caption: string;
  category: string;
  imageUrl: string;
  featured: boolean;
  createdAt: string;
}

export interface OrderEnquiry {
  id: string;
  fullName: string;
  phone: string;
  whatsapp: string;
  email: string;
  outfitType: string;
  category: string;
  occasion: string;
  preferredFabric: string;
  preferredColor: string;
  appointmentDate: string;
  deliveryDate: string;
  instructions: string;
  inspirationImage: string;
  status: 'New' | 'Contacted' | 'In Progress' | 'Completed' | 'Cancelled';
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  status: 'Unread' | 'Read' | 'Replied';
  createdAt: string;
}

export interface Testimonial {
  id: string;
  customerName: string;
  roleOrOccasion: string;
  review: string;
  rating: number;
  photoUrl: string;
  approved: boolean;
  isSample: boolean;
  createdAt: string;
}

export interface SiteSettings {
  whatsappNumber: string;
  altPhoneNumber: string;
  address: string;
  openingHours: string;
  instagramUrl: string;
  facebookUrl: string;
  heroHeadline: string;
  heroSubtext: string;
  deliveryPolicy: string;
  updatedAt: string;
}

export const COLLECTION_CATEGORIES = [
  'All Categories',
  'Native and Traditional Wear',
  'Aso-Ebi',
  'Ankara Styles',
  'Lace Outfits',
  'Corporate Wear',
  'Casual Wear',
  'Wedding Dresses',
  'Bridal Reception Outfits',
  'Party and Dinner Dresses',
  "Children's Clothing",
  'Custom-Made Designs',
] as const;

export const HOMEPAGE_FEATURED_CATEGORIES = [
  {
    id: 'feat-1',
    name: 'Traditional Outfits',
    mappedCategory: 'Native and Traditional Wear',
    description: 'Regal Nigerian silhouettes tailored in hand-woven Aso-Oke, brocade, and rich traditional textiles.',
    imageUrl: BRAND_IMAGES.heroCouture,
  },
  {
    id: 'feat-2',
    name: 'Aso-Ebi & Wedding Collections',
    mappedCategory: 'Aso-Ebi',
    description: 'Show-stopping cord lace, French tulle, and hand-beaded corset gowns crafted for celebratory occasions.',
    imageUrl: BRAND_IMAGES.asoEbiLace,
  },
  {
    id: 'feat-3',
    name: 'Corporate and Office Wear',
    mappedCategory: 'Corporate Wear',
    description: 'Sharp, structured blazers, pencil dresses, and tailored two-piece sets for commanding executive presence.',
    imageUrl: BRAND_IMAGES.ankaraContemporary,
  },
  {
    id: 'feat-4',
    name: 'Casual Wear',
    mappedCategory: 'Casual Wear',
    description: 'Effortless everyday elegance in breathable cottons, silk-blend kaftans, and relaxed contemporary cuts.',
    imageUrl: BRAND_IMAGES.atelierStudio,
  },
  {
    id: 'feat-5',
    name: 'Dinner and Party Outfits',
    mappedCategory: 'Party and Dinner Dresses',
    description: 'Sculptural evening gowns and red-carpet silhouettes designed to turn heads at gala dinners and celebrations.',
    imageUrl: BRAND_IMAGES.heroCouture,
  },
  {
    id: 'feat-6',
    name: 'Bridal and Reception Dresses',
    mappedCategory: 'Bridal Reception Outfits',
    description: 'Bespoke bridal couture and second-look reception gowns with intricate embellishment and flawless drapery.',
    imageUrl: BRAND_IMAGES.bridalCouture,
  },
  {
    id: 'feat-7',
    name: "Children's Wear",
    mappedCategory: "Children's Clothing",
    description: 'Carefully finished celebratory dresses, traditional sets, and flower-girl couture with gentle linings.',
    imageUrl: BRAND_IMAGES.bridalCouture,
  },
  {
    id: 'feat-8',
    name: 'Bespoke and Custom-Made Outfits',
    mappedCategory: 'Custom-Made Designs',
    description: 'One-of-a-kind couture creations drafted from your individual body measurements and personal style vision.',
    imageUrl: BRAND_IMAGES.asoEbiLace,
  },
  {
    id: 'feat-9',
    name: 'Contemporary Ankara Styles',
    mappedCategory: 'Ankara Styles',
    description: 'Modern architectural blazer dresses, flared midi skirts, and structured Nigerian wax print ensembles.',
    imageUrl: BRAND_IMAGES.ankaraContemporary,
  },
  {
    id: 'feat-10',
    name: 'Luxury Lace Ensembles',
    mappedCategory: 'Lace Outfits',
    description: 'Intricate Guipure, Chantilly, and French lace garments finished with hand-sewn beadwork and clean linings.',
    imageUrl: BRAND_IMAGES.asoEbiLace,
  },
];

export const DEFAULT_COLLECTIONS: CollectionItem[] = [
  {
    id: 'col-1',
    title: 'The Royal Champagne Aso-Ebi Gown',
    category: 'Aso-Ebi',
    description: 'Sculpted corset mermaid silhouette in champagne gold Chantilly lace with dramatic puff sleeves and hand-sewn crystal beadwork.',
    imageUrl: BRAND_IMAGES.heroCouture,
    priceEstimate: 'From ₦95,000',
    featured: true,
    createdAt: '2026-10-01T10:00:00Z',
  },
  {
    id: 'col-2',
    title: 'Bronze Empress Cord Lace Ensemble',
    category: 'Lace Outfits',
    description: 'Floor-length fitted gown crafted from luxury Nigerian guipure lace with high illusion neckline and sweeping train.',
    imageUrl: BRAND_IMAGES.asoEbiLace,
    priceEstimate: 'From ₦85,000',
    featured: true,
    createdAt: '2026-10-02T10:00:00Z',
  },
  {
    id: 'col-3',
    title: 'Architectural Ankara Blazer Dress',
    category: 'Ankara Styles',
    description: 'Double-breasted structured blazer dress in warm gold and espresso wax print with asymmetric pleated hem.',
    imageUrl: BRAND_IMAGES.ankaraContemporary,
    priceEstimate: 'From ₦48,000',
    featured: true,
    createdAt: '2026-10-03T10:00:00Z',
  },
  {
    id: 'col-4',
    title: 'Ivory Serenity Bridal Reception Gown',
    category: 'Bridal Reception Outfits',
    description: 'Bespoke ivory silk crepe and French floral applique gown with sheer illusion sleeves and cathedral train.',
    imageUrl: BRAND_IMAGES.bridalCouture,
    priceEstimate: 'From ₦180,000',
    featured: true,
    createdAt: '2026-10-04T10:00:00Z',
  },
  {
    id: 'col-5',
    title: 'Olorunsogo Heritage Iro & Buba Set',
    category: 'Native and Traditional Wear',
    description: 'Modernized Yoruba traditional wrapper and blouse in champagne silk brocade with delicate hand-embellished neckline.',
    imageUrl: BRAND_IMAGES.heroCouture,
    priceEstimate: 'From ₦70,000',
    featured: false,
    createdAt: '2026-10-05T10:00:00Z',
  },
  {
    id: 'col-6',
    title: 'Victoria Island Executive Suit Dress',
    category: 'Corporate Wear',
    description: 'Tailored crepe corporate midi dress with subtle Ankara lapel accents, clean lining, and contoured waist seams.',
    imageUrl: BRAND_IMAGES.ankaraContemporary,
    priceEstimate: 'From ₦52,000',
    featured: false,
    createdAt: '2026-10-06T10:00:00Z',
  },
  {
    id: 'col-7',
    title: 'Ekiti Sovereign Cathedral Wedding Dress',
    category: 'Wedding Dresses',
    description: 'Custom-fitted bridal gown featuring pearl-encrusted bodice, structured internal boning, and detachable overskirt.',
    imageUrl: BRAND_IMAGES.bridalCouture,
    priceEstimate: 'From ₦250,000',
    featured: true,
    createdAt: '2026-10-07T10:00:00Z',
  },
  {
    id: 'col-8',
    title: 'Golden Hour Silk Boubou Kaftan',
    category: 'Casual Wear',
    description: 'Relaxed luxury rich-aunty boubou in flowing adire-silk blend with subtle gold trim along the neckline.',
    imageUrl: BRAND_IMAGES.atelierStudio,
    priceEstimate: 'From ₦42,000',
    featured: false,
    createdAt: '2026-10-08T10:00:00Z',
  },
  {
    id: 'col-9',
    title: 'Midnight & Gold Gala Trumpet Gown',
    category: 'Party and Dinner Dresses',
    description: 'Contoured evening dress with draped satin bodice and beaded lace overlay for milestone birthdays and awards nights.',
    imageUrl: BRAND_IMAGES.asoEbiLace,
    priceEstimate: 'From ₦90,000',
    featured: false,
    createdAt: '2026-10-09T10:00:00Z',
  },
  {
    id: 'col-10',
    title: 'Little Princess Tulle & Lace Party Dress',
    category: "Children's Clothing",
    description: 'Soft cotton-lined celebratory dress for young girls featuring layered ivory tulle and champagne lace bodice.',
    imageUrl: BRAND_IMAGES.bridalCouture,
    priceEstimate: 'From ₦32,000',
    featured: false,
    createdAt: '2026-10-10T10:00:00Z',
  },
  {
    id: 'col-11',
    title: 'Atelier Signature Custom Couture Piece',
    category: 'Custom-Made Designs',
    description: 'Individually sketched and pattern-drafted outfit created exclusively around your preferred fabric and silhouette.',
    imageUrl: BRAND_IMAGES.atelierStudio,
    priceEstimate: 'Custom Quote',
    featured: true,
    createdAt: '2026-10-11T10:00:00Z',
  },
];

export const DEFAULT_SERVICES: ServiceItem[] = [
  {
    id: 'srv-1',
    title: 'Custom Clothing and Tailoring',
    description: 'Outfits designed and sewn according to individual customer preferences, personal body measurements, and desired silhouette.',
    imageUrl: BRAND_IMAGES.atelierStudio,
    startingPrice: 'From ₦35,000',
    turnaroundTime: '7–14 Working Days',
  },
  {
    id: 'srv-2',
    title: 'Traditional Outfit Making',
    description: 'Beautifully tailored traditional Nigerian clothing including Iro and Buba, George wrappers, Agbada-inspired sets, and cultural attire.',
    imageUrl: BRAND_IMAGES.heroCouture,
    startingPrice: 'From ₦55,000',
    turnaroundTime: '10–14 Working Days',
  },
  {
    id: 'srv-3',
    title: 'Aso-Ebi and Wedding Outfits',
    description: 'Elegant clothing for weddings and special occasions, featuring precision corset work, beadwork, and flattering drapery.',
    imageUrl: BRAND_IMAGES.asoEbiLace,
    startingPrice: 'From ₦75,000',
    turnaroundTime: '10–21 Working Days',
  },
  {
    id: 'srv-4',
    title: 'Corporate and Office Wear',
    description: 'Smart and sophisticated blazers, pencil dresses, trousers, and contemporary Ankara-accented workwear.',
    imageUrl: BRAND_IMAGES.ankaraContemporary,
    startingPrice: 'From ₦40,000',
    turnaroundTime: '5–10 Working Days',
  },
  {
    id: 'srv-5',
    title: 'Bridal and Special Occasion Wear',
    description: 'Beautiful bespoke outfits for brides, bridal trains, reception second-looks, milestone birthdays, and anniversary celebrations.',
    imageUrl: BRAND_IMAGES.bridalCouture,
    startingPrice: 'From ₦150,000',
    turnaroundTime: '3–6 Weeks',
  },
  {
    id: 'srv-6',
    title: 'Clothing Alterations and Adjustments',
    description: 'Adjusting existing outfits for improved fitting, tapering, hem refinement, and bodice restructuring where offered.',
    imageUrl: BRAND_IMAGES.atelierStudio,
    startingPrice: 'From ₦10,000',
    turnaroundTime: '3–5 Working Days',
  },
  {
    id: 'srv-7',
    title: "Children's Clothing",
    description: 'Beautifully designed traditional outfits, birthday ball gowns, and flower-girl dresses crafted with comfortable inner linings.',
    imageUrl: BRAND_IMAGES.bridalCouture,
    startingPrice: 'From ₦25,000',
    turnaroundTime: '5–10 Working Days',
  },
];

export const DEFAULT_GALLERY: GalleryPhoto[] = [
  {
    id: 'gal-1',
    caption: 'Champagne Gold Sculpted Sleeve Aso-Ebi Couture Gown with Matching Gele',
    category: 'Aso-Ebi',
    imageUrl: BRAND_IMAGES.heroCouture,
    featured: true,
    createdAt: '2026-10-01T10:00:00Z',
  },
  {
    id: 'gal-2',
    caption: 'Precision Draping & Hand-Beaded Lace Bodice Finishing in the EUCHARIA Stitches Studio',
    category: 'Custom-Made Designs',
    imageUrl: BRAND_IMAGES.atelierStudio,
    featured: true,
    createdAt: '2026-10-02T10:00:00Z',
  },
  {
    id: 'gal-3',
    caption: 'Deep Bronze & Gold Guipure Lace Mermaid Reception Dress',
    category: 'Lace Outfits',
    imageUrl: BRAND_IMAGES.asoEbiLace,
    featured: true,
    createdAt: '2026-10-03T10:00:00Z',
  },
  {
    id: 'gal-4',
    caption: 'Contemporary Structured Ankara Blazer Dress in Earthy Gold & Espresso',
    category: 'Ankara Styles',
    imageUrl: BRAND_IMAGES.ankaraContemporary,
    featured: true,
    createdAt: '2026-10-04T10:00:00Z',
  },
  {
    id: 'gal-5',
    caption: 'Ivory French Lace & Silk Crepe Bridal Reception Gown with Cathedral Train',
    category: 'Bridal Reception Outfits',
    imageUrl: BRAND_IMAGES.bridalCouture,
    featured: true,
    createdAt: '2026-10-05T10:00:00Z',
  },
  {
    id: 'gal-6',
    caption: 'Regal Yoruba Traditional Engagement Ensemble with Hand-Beaded Gele',
    category: 'Native and Traditional Wear',
    imageUrl: BRAND_IMAGES.heroCouture,
    featured: true,
    createdAt: '2026-10-06T10:00:00Z',
  },
  {
    id: 'gal-7',
    caption: 'Executive Ankara-Trimmed Structured Suit Dress for Corporate Wear',
    category: 'Corporate Wear',
    imageUrl: BRAND_IMAGES.ankaraContemporary,
    featured: false,
    createdAt: '2026-10-07T10:00:00Z',
  },
  {
    id: 'gal-8',
    caption: 'Cathedral Lace Bridal Gown with Pearl-Encrusted Corset Bodice',
    category: 'Wedding Dresses',
    imageUrl: BRAND_IMAGES.bridalCouture,
    featured: true,
    createdAt: '2026-10-08T10:00:00Z',
  },
  {
    id: 'gal-9',
    caption: 'Gala Evening Mermaid Gown in Bronze Cord Lace',
    category: 'Party and Dinner Dresses',
    imageUrl: BRAND_IMAGES.asoEbiLace,
    featured: false,
    createdAt: '2026-10-09T10:00:00Z',
  },
  {
    id: 'gal-10',
    caption: 'Bespoke Pattern Drafting & Fitting Session in Olorunsogo Studio',
    category: 'Custom-Made Designs',
    imageUrl: BRAND_IMAGES.atelierStudio,
    featured: false,
    createdAt: '2026-10-10T10:00:00Z',
  },
];

export const SAMPLE_TESTIMONIALS: Testimonial[] = [
  {
    id: 'sample-1',
    customerName: 'Sample Client Placeholder (Ado Ekiti)',
    roleOrOccasion: 'Aso-Ebi & Traditional Outfit Showcase',
    review: '[SAMPLE PLACEHOLDER — Awaiting Approved Client Reviews] This card demonstrates how verified customer feedback on garment fitting, neatness of finishing, and timely delivery will appear once approved by the administrator.',
    rating: 5,
    photoUrl: BRAND_IMAGES.asoEbiLace,
    approved: true,
    isSample: true,
    createdAt: '2026-10-01T10:00:00Z',
  },
  {
    id: 'sample-2',
    customerName: 'Sample Client Placeholder (Bridal Reception)',
    roleOrOccasion: 'Bespoke Bridal & Reception Dress',
    review: '[SAMPLE PLACEHOLDER — Awaiting Approved Client Reviews] Real customers can submit their experience using the review form below. Every submission is held in the Admin Dashboard until reviewed and approved by EUCHARIA Stitches.',
    rating: 5,
    photoUrl: BRAND_IMAGES.bridalCouture,
    approved: true,
    isSample: true,
    createdAt: '2026-10-02T10:00:00Z',
  },
  {
    id: 'sample-3',
    customerName: 'Sample Client Placeholder (Corporate Wear)',
    roleOrOccasion: 'Custom Ankara & Office Tailoring',
    review: '[SAMPLE PLACEHOLDER — Awaiting Approved Client Reviews] Share your own review of EUCHARIA Stitches using the form on this page to have your feedback published here.',
    rating: 5,
    photoUrl: BRAND_IMAGES.ankaraContemporary,
    approved: true,
    isSample: true,
    createdAt: '2026-10-03T10:00:00Z',
  },
];

export const DEFAULT_SETTINGS: SiteSettings = {
  whatsappNumber: '08109766393',
  altPhoneNumber: '09161761546',
  address: 'Road 1, Zone 8, Olorunsogo, Ado Ekiti, Ekiti State, Nigeria.',
  openingHours: 'Monday – Friday: 8:30 AM – 6:00 PM | Saturday: 9:00 AM – 5:00 PM | Sunday: Closed (By Appointment Only)',
  instagramUrl: 'https://instagram.com/euchariastitches',
  facebookUrl: 'https://facebook.com/euchariastitches',
  heroHeadline: 'Elegance in Every Stitch.',
  heroSubtext: 'Where creativity meets craftsmanship. We bring your fashion dreams to life with beautifully tailored outfits designed to celebrate your individuality and style.',
  deliveryPolicy: 'Studio fittings and collections take place at our showroom at Road 1, Zone 8, Olorunsogo, Ado Ekiti. Nationwide waybill and courier delivery across Nigeria is available upon completion and final quality inspection. Please book bespoke wedding and Aso-Ebi outfits at least 2 to 4 weeks before your event date.',
  updatedAt: '2026-10-10T10:00:00Z',
};

export const FAQ_ITEMS = [
  {
    question: 'How do I book an outfit or consultation with EUCHARIA Stitches?',
    answer: 'You can submit an order enquiry directly through our "Book an Appointment" page with your preferred outfit category, occasion, and delivery date. Upon submission, you receive an instant email summary, our admin is alerted, and you can download your official PDF Order Dossier.',
  },
  {
    question: 'Do I need to bring my own fabric, or can EUCHARIA Stitches source fabrics?',
    answer: 'Both options are available. You may bring your own Aso-Ebi, Ankara, lace, or silk fabric to our Ado Ekiti studio, or explore our Fabric Library on the Collections page and request fabric sourcing during your consultation.',
  },
  {
    question: 'How far in advance should I place a bespoke or bridal order?',
    answer: 'For casual and corporate outfits, we recommend booking 1 to 2 weeks ahead. For Aso-Ebi, complex corset gowns, and bridal reception dresses, please book 2 to 6 weeks in advance to allow time for fittings and detailed finishing.',
  },
  {
    question: 'Can I order if I live outside Ado Ekiti?',
    answer: 'Yes. Customers across Nigeria can send accurate body measurements and style inspiration via our online enquiry form or WhatsApp, and we arrange secure waybill delivery once your outfit is completed.',
  },
  {
    question: 'Are prices fixed or confirmed automatically when I submit the form?',
    answer: 'No. Because every bespoke garment varies by fabric, embroidery, and design complexity, submitting an order enquiry does not automatically confirm a price or delivery date until our designer reviews your request and discusses the details with you.',
  },
];

export const FASHION_INSPIRATION_NOTES = [
  {
    title: 'Choosing the Right Aso-Ebi Silhouette for Your Body Frame',
    category: 'Style Guide · Aso-Ebi',
    excerpt: 'Structured corset bodices paired with bias-cut or mermaid skirts create timeless proportion while allowing comfortable movement on the dancefloor.',
    image: BRAND_IMAGES.asoEbiLace,
  },
  {
    title: 'Elevating Ankara Prints for the Modern Executive Wardrobe',
    category: 'Editorial · Corporate Wear',
    excerpt: 'Pairing bold Nigerian wax prints with sharp lapel tailoring and neutral linings bridges cultural heritage and boardroom sophistication.',
    image: BRAND_IMAGES.ankaraContemporary,
  },
  {
    title: 'Inside the Atelier: Why Internal Structure Defines Luxury Tailoring',
    category: 'Craftsmanship · Bespoke',
    excerpt: 'From breathable cotton-silk linings to precision seam pressing and hidden boning, true elegance begins beneath the outer fabric.',
    image: BRAND_IMAGES.atelierStudio,
  },
];

export function getWhatsAppLink(customMessage?: string, rawNumber = '08109766393'): string {
  const digits = rawNumber.replace(/\D/g, '');
  const intlNumber = digits.startsWith('0')
    ? `234${digits.slice(1)}`
    : digits.startsWith('234')
    ? digits
    : '2348109766393';

  const defaultMessage =
    'Hello EUCHARIA Stitches, I visited your website and I am interested in making an enquiry about your clothing designs. Please provide more information.';
  const text = encodeURIComponent(customMessage || defaultMessage);
  return `https://wa.me/${intlNumber}?text=${text}`;
}
