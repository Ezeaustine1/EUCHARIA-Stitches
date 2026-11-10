import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

// Local JSON file database store for zero-external-dependency persistence
const DATA_FILE = path.resolve(process.cwd(), '.studio-store.json');

interface StudioStoreData {
  enquiries: any[];
  collections: any[];
  services: any[];
  gallery: any[];
  testimonials: any[];
  contactMessages: any[];
  newsletterSubscribers: any[];
  settings: any | null;
  emailLogs: any[];
}

function readStore(): StudioStoreData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading studio store:', err);
  }
  return {
    enquiries: [],
    collections: [],
    services: [],
    gallery: [],
    testimonials: [],
    contactMessages: [],
    newsletterSubscribers: [],
    settings: null,
    emailLogs: [],
  };
}

function writeStore(data: StudioStoreData) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing studio store:', err);
  }
}

// Initialize Gemini AI Server-Side Client
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

const EUCHARIA_SYSTEM_PROMPT = `You are the official Luxury Fashion Concierge & AI Stylist for EUCHARIA Stitches, a premier Nigerian fashion design, tailoring, and custom clothing house.

CRITICAL BUSINESS FACTS (Always answer accurately using these exact details):
- Business Name: EUCHARIA Stitches
- Tagline: "Elegance in Every Stitch."
- Business Type: Professional Fashion Design, Tailoring and Custom Clothing.
- Studio Address: Road 1, Zone 8, Olorunsogo, Ado Ekiti, Ekiti State, Nigeria.
- Primary WhatsApp Number: 08109766393 (https://wa.me/2348109766393)
- Alternative Phone Number: 09161761546
- Admin Email: ezehaustine1@gmail.com
- Currency: Nigerian Naira (₦).
- Opening Hours: Monday – Friday: 8:30 AM – 6:00 PM | Saturday: 9:00 AM – 5:00 PM | Sunday: Closed (By Appointment Only).

COLLECTIONS & INDICATIVE STARTING PRICES:
1. Aso-Ebi (e.g., The Royal Champagne Aso-Ebi Gown — From ₦95,000)
2. Lace Outfits (e.g., Bronze Empress Cord Lace Ensemble — From ₦85,000)
3. Ankara Styles (e.g., Architectural Ankara Blazer Dress — From ₦48,000)
4. Bridal Reception Outfits (e.g., Ivory Serenity Bridal Reception Gown — From ₦180,000)
5. Native and Traditional Wear (e.g., Olorunsogo Heritage Iro & Buba Set — From ₦70,000)
6. Corporate Wear (e.g., Victoria Island Executive Suit Dress — From ₦52,000)
7. Wedding Dresses (e.g., Ekiti Sovereign Cathedral Wedding Dress — From ₦250,000)
8. Casual Wear (e.g., Golden Hour Silk Boubou Kaftan — From ₦42,000)
9. Party and Dinner Dresses (e.g., Midnight & Gold Gala Trumpet Gown — From ₦90,000)
10. Children's Clothing (e.g., Little Princess Tulle & Lace Party Dress — From ₦32,000)
11. Custom-Made Designs (Atelier Signature Custom Couture Piece — Custom Quote)

SERVICES & TURNAROUND TIMES:
1. Custom Clothing and Tailoring: From ₦35,000 (7–14 Working Days)
2. Traditional Outfit Making: From ₦55,000 (10–14 Working Days)
3. Aso-Ebi and Wedding Outfits: From ₦75,000 (10–21 Working Days)
4. Corporate and Office Wear: From ₦40,000 (5–10 Working Days)
5. Bridal and Special Occasion Wear: From ₦150,000 (3–6 Weeks)
6. Clothing Alterations and Adjustments: From ₦10,000 (3–5 Working Days)
7. Children's Clothing: From ₦25,000 (5–10 Working Days)

FABRIC LIBRARY EXPERTISE:
- Hand-Woven Aso-Oke: Best for traditional engagements, Agbada, Iro & Buba, and structured Gele. Care: Dry clean only, store flat wrapped in muslin.
- French & Chantilly Lace: Ideal for illusion necklines, bridal overlays, and corset Aso-Ebi gowns. Care: Delicate hand wash or specialist dry clean; never wring.
- Guipure & Cord Lace: Rich 3D texture suited for mermaid gowns, skirt & blouse sets, and structured bodices. Care: Steam from the reverse side.
- Nigerian Wax Print (Ankara): Versatile 100% cotton print great for structured blazer dresses, corporate sets, and casual kimono sets. Care: Cold wash with mild detergent, iron on cotton setting on reverse side.
- Adire Silk & Crepe: Fluid drape for luxury boubous, kaftans, and resort wear. Care: Cold hand wash separately, hang to dry in shade.
- Bridal Mikado & Duchess Satin: Architectural structure for cathedral wedding gowns and reception dresses. Care: Specialist bridal dry cleaning only.

ORDER & BOOKING POLICY:
- Customers can book via the "Book an Appointment" page or WhatsApp (08109766393).
- Submitting an online order enquiry sends a professional confirmation email to the client, alerts the admin, and provides an instant downloadable PDF Order Dossier.
- Prices and delivery dates are finalized after the designer reviews the customer's fabric, style, and measurement requirements.
- Keep your tone warm, elegant, helpful, concise (2-4 short paragraphs or bullet points), and accurate.`;

// API: Get Store State
app.get('/api/store', (_req, res) => {
  const store = readStore();
  res.json(store);
});

// API: Update Store State
app.post('/api/store', (req, res) => {
  const current = readStore();
  const updated: StudioStoreData = {
    ...current,
    ...req.body,
  };
  writeStore(updated);
  res.json({ ok: true, store: updated });
});

// API: Live AI Chat Concierge
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const ai = getAiClient();
    if (!ai) {
      // Fallback intelligent response if no API key is configured
      return res.json({
        reply:
          'Welcome to EUCHARIA Stitches! You can visit our showroom at Road 1, Zone 8, Olorunsogo, Ado Ekiti, Ekiti State, or message us on WhatsApp at 08109766393 (Alternative: 09161761546). We craft bespoke Aso-Ebi, Traditional Wear, Ankara Styles, Corporate Wear, Bridal Gowns, and Children’s Clothing. Use our "Book an Appointment" page to submit your order enquiry and download your official PDF order summary.',
      });
    }

    const conversationTranscript = history
      .slice(-8)
      .map((m: { role: string; text: string }) => `${m.role === 'user' ? 'Client' : 'Stylist'}: ${m.text}`)
      .join('\n');

    const fullPrompt = conversationTranscript
      ? `${conversationTranscript}\nClient: ${message}\nStylist:`
      : `Client: ${message}\nStylist:`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: fullPrompt,
      config: {
        systemInstruction: EUCHARIA_SYSTEM_PROMPT,
      },
    });

    const replyText =
      response.text ||
      'Thank you for reaching out to EUCHARIA Stitches. Please let us know how we can assist with your outfit booking, or message us directly on WhatsApp at 08109766393.';

    return res.json({ reply: replyText });
  } catch (error: any) {
    console.error('Gemini chat error:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate AI response.',
    });
  }
});

// API: Send Professional Order Enquiry Emails to Client and Admin
app.post('/api/enquiries/notify', async (req, res) => {
  try {
    const { enquiry, adminEmail = 'ezehaustine1@gmail.com' } = req.body;
    if (!enquiry) {
      return res.status(400).json({ error: 'Missing enquiry details' });
    }

    const refNumber = `ES-${String(enquiry.id || Date.now()).slice(-6).toUpperCase()}`;
    const submittedDate = new Date(enquiry.createdAt || Date.now()).toLocaleString('en-NG', {
      dateStyle: 'full',
      timeStyle: 'short',
    });

    const clientEmailSubject = `Order Enquiry Confirmation [${refNumber}] – EUCHARIA Stitches`;
    const adminEmailSubject = `New Bespoke Order Enquiry [${refNumber}] from ${enquiry.fullName}`;

    const clientEmailHtml = `
      <div style="font-family: Georgia, serif; max-width: 640px; margin: 0 auto; border: 1px solid #E6DEC8; background-color: #FAF7F2; color: #1A1412;">
        <div style="background-color: #1A1412; color: #FAF7F2; padding: 28px 32px; text-align: center; border-bottom: 3px solid #C5A059;">
          <div style="font-size: 13px; letter-spacing: 3px; color: #C5A059; text-transform: uppercase;">ES · EUCHARIA Stitches</div>
          <h1 style="margin: 8px 0 4px; font-size: 26px; font-weight: normal;">Bespoke Order Enquiry Confirmation</h1>
          <div style="font-size: 12px; color: #D6CEC2; font-style: italic;">"Elegance in Every Stitch."</div>
        </div>
        <div style="padding: 32px; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6;">
          <p>Dear <strong>${enquiry.fullName}</strong>,</p>
          <p>Thank you for choosing <strong>EUCHARIA Stitches</strong>. We have received your bespoke outfit order enquiry (<strong style="color: #9E7B36;">Reference: ${refNumber}</strong>) submitted on ${submittedDate}.</p>
          <div style="background-color: #FFFFFF; border: 1px solid #E6DEC8; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; font-family: Georgia, serif; font-size: 18px; color: #1A1412; border-bottom: 1px solid #E6DEC8; padding-bottom: 8px;">Your Order Specifications</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr><td style="padding: 6px 0; color: #5C4E47; width: 42%;"><strong>Reference ID:</strong></td><td style="padding: 6px 0;">${refNumber}</td></tr>
              <tr><td style="padding: 6px 0; color: #5C4E47;"><strong>Full Name:</strong></td><td style="padding: 6px 0;">${enquiry.fullName}</td></tr>
              <tr><td style="padding: 6px 0; color: #5C4E47;"><strong>Phone / WhatsApp:</strong></td><td style="padding: 6px 0;">${enquiry.phone} / ${enquiry.whatsapp}</td></tr>
              <tr><td style="padding: 6px 0; color: #5C4E47;"><strong>Email Address:</strong></td><td style="padding: 6px 0;">${enquiry.email || 'Not provided'}</td></tr>
              <tr><td style="padding: 6px 0; color: #5C4E47;"><strong>Requested Outfit:</strong></td><td style="padding: 6px 0;"><strong>${enquiry.outfitType}</strong></td></tr>
              <tr><td style="padding: 6px 0; color: #5C4E47;"><strong>Clothing Category:</strong></td><td style="padding: 6px 0;">${enquiry.category}</td></tr>
              <tr><td style="padding: 6px 0; color: #5C4E47;"><strong>Occasion:</strong></td><td style="padding: 6px 0;">${enquiry.occasion}</td></tr>
              <tr><td style="padding: 6px 0; color: #5C4E47;"><strong>Preferred Fabric:</strong></td><td style="padding: 6px 0;">${enquiry.preferredFabric || 'To be discussed during consultation'}</td></tr>
              <tr><td style="padding: 6px 0; color: #5C4E47;"><strong>Preferred Colour(s):</strong></td><td style="padding: 6px 0;">${enquiry.preferredColor}</td></tr>
              <tr><td style="padding: 6px 0; color: #5C4E47;"><strong>Preferred Appointment Date:</strong></td><td style="padding: 6px 0;">${enquiry.appointmentDate}</td></tr>
              <tr><td style="padding: 6px 0; color: #5C4E47;"><strong>Target Delivery Date:</strong></td><td style="padding: 6px 0;">${enquiry.deliveryDate}</td></tr>
              <tr><td style="padding: 6px 0; color: #5C4E47;"><strong>Additional Instructions:</strong></td><td style="padding: 6px 0;">${enquiry.instructions || 'None'}</td></tr>
            </table>
          </div>
          <p style="font-size: 13px; color: #5C4E47;"><strong>Important Note:</strong> Our lead designer is reviewing your specifications. Final pricing (in ₦) and delivery schedule will be confirmed following your consultation.</p>
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #E6DEC8; font-size: 12px; color: #5C4E47;">
            <strong>EUCHARIA Stitches Atelier</strong><br/>
            Road 1, Zone 8, Olorunsogo, Ado Ekiti, Ekiti State, Nigeria<br/>
            WhatsApp: 08109766393 | Alt Phone: 09161761546
          </div>
        </div>
      </div>
    `;

    const adminEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; border: 1px solid #E6DEC8; background-color: #FFFFFF; color: #1A1412;">
        <div style="background-color: #1A1412; color: #FAF7F2; padding: 22px 28px; border-bottom: 3px solid #C5A059;">
          <div style="font-size: 11px; letter-spacing: 2px; color: #C5A059; text-transform: uppercase;">Admin Studio Alert · EUCHARIA Stitches</div>
          <h2 style="margin: 6px 0 0; font-family: Georgia, serif; font-size: 22px;">New Client Order Enquiry [${refNumber}]</h2>
        </div>
        <div style="padding: 28px; font-size: 14px; line-height: 1.6;">
          <p>A new bespoke order enquiry has just been submitted on the <strong>EUCHARIA Stitches</strong> website:</p>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; background: #FAF7F2; border: 1px solid #E6DEC8;">
            <tr><td style="padding: 8px 12px; border-bottom: 1px solid #E6DEC8;"><strong>Reference ID</strong></td><td style="padding: 8px 12px; border-bottom: 1px solid #E6DEC8;">${refNumber}</td></tr>
            <tr><td style="padding: 8px 12px; border-bottom: 1px solid #E6DEC8;"><strong>Client Name</strong></td><td style="padding: 8px 12px; border-bottom: 1px solid #E6DEC8;">${enquiry.fullName}</td></tr>
            <tr><td style="padding: 8px 12px; border-bottom: 1px solid #E6DEC8;"><strong>Phone Number</strong></td><td style="padding: 8px 12px; border-bottom: 1px solid #E6DEC8;">${enquiry.phone}</td></tr>
            <tr><td style="padding: 8px 12px; border-bottom: 1px solid #E6DEC8;"><strong>WhatsApp Number</strong></td><td style="padding: 8px 12px; border-bottom: 1px solid #E6DEC8;">${enquiry.whatsapp}</td></tr>
            <tr><td style="padding: 8px 12px; border-bottom: 1px solid #E6DEC8;"><strong>Client Email</strong></td><td style="padding: 8px 12px; border-bottom: 1px solid #E6DEC8;">${enquiry.email || 'Not provided'}</td></tr>
            <tr><td style="padding: 8px 12px; border-bottom: 1px solid #E6DEC8;"><strong>Outfit Requested</strong></td><td style="padding: 8px 12px; border-bottom: 1px solid #E6DEC8;"><strong>${enquiry.outfitType}</strong></td></tr>
            <tr><td style="padding: 8px 12px; border-bottom: 1px solid #E6DEC8;"><strong>Category</strong></td><td style="padding: 8px 12px; border-bottom: 1px solid #E6DEC8;">${enquiry.category}</td></tr>
            <tr><td style="padding: 8px 12px; border-bottom: 1px solid #E6DEC8;"><strong>Occasion</strong></td><td style="padding: 8px 12px; border-bottom: 1px solid #E6DEC8;">${enquiry.occasion}</td></tr>
            <tr><td style="padding: 8px 12px; border-bottom: 1px solid #E6DEC8;"><strong>Preferred Fabric</strong></td><td style="padding: 8px 12px; border-bottom: 1px solid #E6DEC8;">${enquiry.preferredFabric || 'Not specified'}</td></tr>
            <tr><td style="padding: 8px 12px; border-bottom: 1px solid #E6DEC8;"><strong>Preferred Colour</strong></td><td style="padding: 8px 12px; border-bottom: 1px solid #E6DEC8;">${enquiry.preferredColor}</td></tr>
            <tr><td style="padding: 8px 12px; border-bottom: 1px solid #E6DEC8;"><strong>Appointment Date</strong></td><td style="padding: 8px 12px; border-bottom: 1px solid #E6DEC8;">${enquiry.appointmentDate}</td></tr>
            <tr><td style="padding: 8px 12px; border-bottom: 1px solid #E6DEC8;"><strong>Required Delivery Date</strong></td><td style="padding: 8px 12px; border-bottom: 1px solid #E6DEC8;">${enquiry.deliveryDate}</td></tr>
            <tr><td style="padding: 8px 12px;"><strong>Instructions / Notes</strong></td><td style="padding: 8px 12px;">${enquiry.instructions || 'None'}</td></tr>
          </table>
        </div>
      </div>
    `;

    let smtpSent = false;
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: Number(process.env.SMTP_PORT) === 465,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        // Send to Admin
        await transporter.sendMail({
          from: `"EUCHARIA Stitches Atelier" <${process.env.SMTP_USER}>`,
          to: adminEmail,
          subject: adminEmailSubject,
          html: adminEmailHtml,
        });

        // Send to Client if email provided
        if (enquiry.email && enquiry.email.includes('@')) {
          await transporter.sendMail({
            from: `"EUCHARIA Stitches" <${process.env.SMTP_USER}>`,
            to: enquiry.email,
            subject: clientEmailSubject,
            html: clientEmailHtml,
          });
        }
        smtpSent = true;
      } catch (smtpError) {
        console.warn('SMTP dispatch skipped or failed, logged in studio store:', smtpError);
      }
    }

    // Persist to local studio store & email logs
    const store = readStore();
    const emailRecord = {
      id: `mail-${Date.now()}`,
      refNumber,
      clientEmail: enquiry.email || 'No email entered (WhatsApp provided)',
      adminEmail,
      clientEmailSubject,
      adminEmailSubject,
      clientEmailHtml,
      adminEmailHtml,
      smtpSent,
      createdAt: new Date().toISOString(),
    };
    store.enquiries = [enquiry, ...store.enquiries.filter((e) => e.id !== enquiry.id)];
    store.emailLogs = [emailRecord, ...(store.emailLogs || [])];
    writeStore(store);

    return res.json({
      ok: true,
      refNumber,
      smtpSent,
      emailRecord,
    });
  } catch (error: any) {
    console.error('Failed to process enquiry notification:', error);
    return res.status(500).json({ error: 'Failed to process email notifications' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EUCHARIA Stitches server running on http://localhost:${PORT}`);
  });
}

startServer();
