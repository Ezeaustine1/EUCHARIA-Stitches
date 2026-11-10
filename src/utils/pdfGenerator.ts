import { jsPDF } from 'jspdf';
import { OrderEnquiry, SiteSettings } from '../data/initialData.ts';

export interface EmailDispatchResult {
  refNumber: string;
  smtpSent: boolean;
  clientEmailSubject: string;
  adminEmailSubject: string;
  clientEmailBodyText: string;
  adminEmailBodyText: string;
  clientEmailHtml: string;
  adminEmailHtml: string;
}

export function buildProfessionalEmails(
  enquiry: OrderEnquiry,
  settings: SiteSettings,
  customRef?: string
): EmailDispatchResult {
  const refNumber =
    customRef || `ES-${String(enquiry.id || Date.now()).slice(-6).toUpperCase()}`;
  const submittedDate = new Date(enquiry.createdAt || Date.now()).toLocaleString('en-NG', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const clientEmailSubject = `Order Enquiry Confirmation [${refNumber}] – EUCHARIA Stitches`;
  const adminEmailSubject = `New Bespoke Order Enquiry [${refNumber}] – ${enquiry.fullName} (${enquiry.outfitType})`;

  const clientEmailBodyText = `Dear ${enquiry.fullName},

Thank you for choosing EUCHARIA Stitches ("Elegance in Every Stitch.").
We have received your bespoke outfit order enquiry [Reference: ${refNumber}] submitted on ${submittedDate}.

==================================================
SUMMARY OF YOUR ORDER ENQUIRY
==================================================
• Reference ID: ${refNumber}
• Client Name: ${enquiry.fullName}
• Phone Number: ${enquiry.phone}
• WhatsApp Number: ${enquiry.whatsapp}
• Email Address: ${enquiry.email || 'Not provided'}
• Outfit Requested: ${enquiry.outfitType}
• Clothing Category: ${enquiry.category}
• Occasion: ${enquiry.occasion}
• Preferred Fabric: ${enquiry.preferredFabric || 'To be selected during consultation'}
• Preferred Colour(s): ${enquiry.preferredColor}
• Preferred Appointment Date: ${enquiry.appointmentDate}
• Target Delivery Date: ${enquiry.deliveryDate}
• Additional Instructions / Measurements: ${enquiry.instructions || 'None'}

NEXT STEPS:
Our lead designer is reviewing your specifications. Final pricing (in Nigerian Naira ₦) and delivery timeline will be confirmed following your consultation.

Warm regards,
EUCHARIA Stitches Atelier
${settings.address}
WhatsApp: ${settings.whatsappNumber} | Phone: ${settings.altPhoneNumber}`;

  const adminEmailBodyText = `NEW BESPOKE ORDER ENQUIRY – EUCHARIA STITCHES ATELIER
Reference ID: ${refNumber}
Submitted: ${submittedDate}

==================================================
CLIENT & GARMENT SPECIFICATIONS
==================================================
• Client Full Name: ${enquiry.fullName}
• Phone Number: ${enquiry.phone}
• WhatsApp Number: ${enquiry.whatsapp}
• Client Email: ${enquiry.email || 'Not provided'}
• Requested Outfit: ${enquiry.outfitType}
• Clothing Category: ${enquiry.category}
• Event / Occasion: ${enquiry.occasion}
• Preferred Fabric: ${enquiry.preferredFabric || 'Not specified'}
• Preferred Colour(s): ${enquiry.preferredColor}
• Preferred Fitting / Appointment Date: ${enquiry.appointmentDate}
• Required Delivery Date: ${enquiry.deliveryDate}
• Special Instructions / Notes: ${enquiry.instructions || 'None'}
• Inspiration Photo Attached: ${enquiry.inspirationImage ? 'Yes (Available in Admin Dashboard)' : 'No'}

Direct WhatsApp Link to Client: https://wa.me/${enquiry.whatsapp.replace(/\D/g, '').replace(/^0/, '234')}`;

  const clientEmailHtml = `
    <div style="font-family: Georgia, serif; max-width: 640px; margin: 0 auto; border: 1px solid #E6DEC8; background-color: #FAF7F2; color: #1A1412;">
      <div style="background-color: #1A1412; color: #FAF7F2; padding: 24px; text-align: center; border-bottom: 3px solid #C5A059;">
        <div style="font-size: 12px; letter-spacing: 3px; color: #C5A059; text-transform: uppercase;">ES · EUCHARIA Stitches</div>
        <h2 style="margin: 6px 0 2px; font-size: 22px; font-weight: normal;">Bespoke Order Enquiry Confirmation</h2>
        <div style="font-size: 12px; color: #D6CEC2; font-style: italic;">"Elegance in Every Stitch."</div>
      </div>
      <div style="padding: 24px; font-family: sans-serif; font-size: 13px; line-height: 1.6;">
        <p>Dear <strong>${enquiry.fullName}</strong>,</p>
        <p>Thank you for choosing <strong>EUCHARIA Stitches</strong>. Below is the official record of your bespoke order enquiry (<strong style="color: #9E7B36;">${refNumber}</strong>):</p>
        <div style="background: #FFFFFF; border: 1px solid #E6DEC8; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Outfit Requested:</strong> ${enquiry.outfitType} (${enquiry.category})</p>
          <p style="margin: 4px 0;"><strong>Occasion:</strong> ${enquiry.occasion}</p>
          <p style="margin: 4px 0;"><strong>Fabric & Colour:</strong> ${enquiry.preferredFabric || 'Studio consultation'} · ${enquiry.preferredColor}</p>
          <p style="margin: 4px 0;"><strong>Appointment Date:</strong> ${enquiry.appointmentDate}</p>
          <p style="margin: 4px 0;"><strong>Target Delivery Date:</strong> ${enquiry.deliveryDate}</p>
          <p style="margin: 4px 0;"><strong>Phone / WhatsApp:</strong> ${enquiry.phone} / ${enquiry.whatsapp}</p>
          <p style="margin: 4px 0;"><strong>Additional Notes:</strong> ${enquiry.instructions || 'None'}</p>
        </div>
        <p style="font-size: 12px; color: #5C4E47;">Our designer will review your request and contact you to confirm your fitting and final quote in Naira (₦).</p>
      </div>
    </div>
  `;

  const adminEmailHtml = `
    <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto; border: 1px solid #E6DEC8; background-color: #FFFFFF; color: #1A1412;">
      <div style="background-color: #1A1412; color: #FAF7F2; padding: 20px 24px; border-bottom: 3px solid #C5A059;">
        <div style="font-size: 11px; letter-spacing: 2px; color: #C5A059; text-transform: uppercase;">Admin Order Alert · EUCHARIA Stitches</div>
        <h3 style="margin: 4px 0 0; font-family: Georgia, serif; font-size: 20px;">New Client Order [${refNumber}] – ${enquiry.fullName}</h3>
      </div>
      <div style="padding: 24px; font-size: 13px; line-height: 1.6;">
        <p style="margin: 4px 0;"><strong>Client Name:</strong> ${enquiry.fullName}</p>
        <p style="margin: 4px 0;"><strong>Phone / WhatsApp:</strong> ${enquiry.phone} / ${enquiry.whatsapp}</p>
        <p style="margin: 4px 0;"><strong>Client Email:</strong> ${enquiry.email || 'Not provided'}</p>
        <p style="margin: 4px 0;"><strong>Requested Outfit:</strong> ${enquiry.outfitType} (${enquiry.category})</p>
        <p style="margin: 4px 0;"><strong>Occasion:</strong> ${enquiry.occasion}</p>
        <p style="margin: 4px 0;"><strong>Preferred Fabric & Colour:</strong> ${enquiry.preferredFabric || 'Not specified'} · ${enquiry.preferredColor}</p>
        <p style="margin: 4px 0;"><strong>Appointment Date:</strong> ${enquiry.appointmentDate}</p>
        <p style="margin: 4px 0;"><strong>Required Delivery Date:</strong> ${enquiry.deliveryDate}</p>
        <p style="margin: 4px 0;"><strong>Instructions:</strong> ${enquiry.instructions || 'None'}</p>
      </div>
    </div>
  `;

  return {
    refNumber,
    smtpSent: false,
    clientEmailSubject,
    adminEmailSubject,
    clientEmailBodyText,
    adminEmailBodyText,
    clientEmailHtml,
    adminEmailHtml,
  };
}

export function downloadOrderEnquiryPdf(
  enquiry: OrderEnquiry,
  settings: SiteSettings,
  customRef?: string
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const refNumber =
    customRef || `ES-${String(enquiry.id || Date.now()).slice(-6).toUpperCase()}`;
  const dateStr = new Date(enquiry.createdAt || Date.now()).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Luxury Header Banner
  doc.setFillColor(26, 20, 18); // #1A1412
  doc.rect(0, 0, 210, 44, 'F');

  // Champagne Gold Accent Line
  doc.setFillColor(197, 160, 89); // #C5A059
  doc.rect(0, 44, 210, 2, 'F');

  // Brand Monogram & Name
  doc.setTextColor(197, 160, 89);
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('ES  ·  BESPOKE COUTURE DOSSIER', 15, 15);

  doc.setTextColor(250, 247, 242);
  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  doc.text('EUCHARIA STITCHES', 15, 26);

  doc.setFont('times', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(214, 206, 194);
  doc.text('"Elegance in Every Stitch."', 15, 34);

  // Reference Badge on Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(197, 160, 89);
  doc.text(`ORDER REF: ${refNumber}`, 195, 20, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(250, 247, 242);
  doc.text(`Date Issued: ${dateStr}`, 195, 27, { align: 'right' });
  doc.text(`Status: ${enquiry.status || 'New Enquiry'}`, 195, 34, { align: 'right' });

  // Section 1: Client Information
  let y = 58;
  doc.setTextColor(26, 20, 18);
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.text('1. Client Information', 15, y);

  y += 3;
  doc.setDrawColor(230, 222, 200);
  doc.line(15, y, 195, y);

  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const clientRows: [string, string][] = [
    ['Full Name:', enquiry.fullName],
    ['Primary Phone:', enquiry.phone],
    ['WhatsApp Number:', enquiry.whatsapp],
    ['Email Address:', enquiry.email || 'Not provided'],
  ];

  clientRows.forEach(([label, val]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(92, 78, 71);
    doc.text(label, 15, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(26, 20, 18);
    doc.text(String(val || '-'), 68, y);
    y += 7;
  });

  // Section 2: Bespoke Outfit & Fabric Specifications
  y += 6;
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(26, 20, 18);
  doc.text('2. Bespoke Garment & Schedule Specifications', 15, y);

  y += 3;
  doc.line(15, y, 195, y);

  y += 8;
  doc.setFontSize(10);

  const specRows: [string, string][] = [
    ['Requested Outfit Style:', enquiry.outfitType],
    ['Clothing Category:', enquiry.category],
    ['Occasion / Event:', enquiry.occasion],
    ['Preferred Fabric:', enquiry.preferredFabric || 'To be selected at consultation'],
    ['Preferred Colour Palette:', enquiry.preferredColor],
    ['Preferred Fitting Date:', enquiry.appointmentDate],
    ['Target Delivery Date:', enquiry.deliveryDate],
  ];

  specRows.forEach(([label, val]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(92, 78, 71);
    doc.text(label, 15, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(26, 20, 18);
    doc.text(String(val || '-'), 68, y);
    y += 7;
  });

  // Section 3: Additional Instructions & Measurements
  y += 6;
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.text('3. Client Instructions & Measurement Notes', 15, y);

  y += 3;
  doc.line(15, y, 195, y);

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(26, 20, 18);
  const notesText =
    enquiry.instructions && enquiry.instructions.trim()
      ? enquiry.instructions
      : 'No additional instructions entered. Measurements and styling details will be finalized during consultation.';
  const splitNotes = doc.splitTextToSize(notesText, 175);
  doc.text(splitNotes, 15, y);
  y += splitNotes.length * 6 + 6;

  // Embedded Inspiration Image if uploaded
  if (enquiry.inspirationImage && enquiry.inspirationImage.startsWith('data:image')) {
    try {
      if (y < 215) {
        doc.setFont('times', 'bold');
        doc.setFontSize(12);
        doc.text('Attached Fabric / Style Inspiration:', 15, y);
        y += 4;
        doc.addImage(enquiry.inspirationImage, 'JPEG', 15, y, 42, 50);
        y += 56;
      }
    } catch {
      // Skip image embedding if unsupported format
    }
  }

  // Important Policy Box
  const footerY = 252;
  doc.setFillColor(245, 239, 230); // #F5EFE6
  doc.setDrawColor(197, 160, 89);
  doc.rect(15, footerY, 180, 22, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(158, 123, 54);
  doc.text('IMPORTANT BESPOKE CONSULTATION NOTICE', 20, footerY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(26, 20, 18);
  doc.text(
    'This document confirms receipt of your bespoke order enquiry. Final pricing (in Nigerian Naira ₦) and delivery dates',
    20,
    footerY + 12
  );
  doc.text(
    'are confirmed after our designer reviews your fabric, embroidery, and fitting details.',
    20,
    footerY + 17
  );

  // Studio Contact Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(92, 78, 71);
  doc.text(
    `EUCHARIA Stitches · ${settings.address} · WhatsApp: ${settings.whatsappNumber} · Phone: ${settings.altPhoneNumber}`,
    105,
    284,
    { align: 'center' }
  );

  doc.save(`EUCHARIA-Stitches-Order-${refNumber}.pdf`);
}
