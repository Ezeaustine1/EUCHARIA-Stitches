import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Scissors } from 'lucide-react';
import { SiteSettings } from '../data/initialData.ts';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface LiveChatWidgetProps {
  settings: SiteSettings;
  onNavigateToBooking: () => void;
}

function generateLocalAccurateAnswer(query: string, settings: SiteSettings): string {
  const q = query.toLowerCase();

  if (q.includes('address') || q.includes('where') || q.includes('location') || q.includes('ekiti')) {
    return `EUCHARIA Stitches is located at ${settings.address} You can visit our studio for consultations and fittings during our opening hours (${settings.openingHours}) or message us on WhatsApp at ${settings.whatsappNumber}.`;
  }
  if (q.includes('price') || q.includes('cost') || q.includes('how much') || q.includes('naira')) {
    return `Our indicative starting prices in Nigerian Naira (₦) are:\n• Custom Clothing & Tailoring: From ₦35,000\n• Corporate & Office Wear: From ₦40,000\n• Ankara Styles: From ₦48,000\n• Traditional Outfit Making: From ₦55,000\n• Aso-Ebi & Lace Outfits: From ₦75,000 – ₦95,000\n• Bridal & Reception Gowns: From ₦150,000 – ₦250,000\n• Children's Clothing: From ₦25,000\nFinal pricing depends on your chosen fabric, beadwork, and silhouette.`;
  }
  if (q.includes('fabric') || q.includes('aso-oke') || q.includes('lace') || q.includes('ankara')) {
    return `Our Fabric Library in the "Collections" page covers 10 premier fabrics:\n• Hand-Woven Aso-Oke (Dry clean only; ideal for traditional engagements & Auto-Gele)\n• French Chantilly & Guipure Cord Lace (Hand soak or dry clean; ideal for mermaid & corset gowns)\n• Nigerian Wax Print Ankara (Cool wash, iron on reverse; great for blazers & corporate wear)\n• Adire Silk & Bridal Mikado Satin. You may bring your own fabric or ask us to source it for you!`;
  }
  if (q.includes('book') || q.includes('order') || q.includes('appointment') || q.includes('pdf')) {
    return `To place an order, click "Book an Appointment" in the top bar. Once you submit your order enquiry, you will immediately receive a professional confirmation email summary, our administrator will be notified, and you can download your official PDF Order Dossier on the spot!`;
  }
  if (q.includes('phone') || q.includes('whatsapp') || q.includes('contact') || q.includes('call')) {
    return `You can reach EUCHARIA Stitches directly on WhatsApp at ${settings.whatsappNumber} or call our alternative line at ${settings.altPhoneNumber}. Our studio address is ${settings.address}`;
  }
  if (q.includes('time') || q.includes('long') || q.includes('delivery') || q.includes('turnaround')) {
    return `Our typical turnaround times are:\n• Corporate, Casual & Children's Wear: 5–10 Working Days\n• Traditional & Aso-Ebi Outfits: 10–21 Working Days\n• Bridal & Reception Couture: 3–6 Weeks\n• Alterations: 3–5 Working Days\nWe also offer nationwide waybill delivery across Nigeria upon completion.`;
  }

  return `Welcome to EUCHARIA Stitches ("Elegance in Every Stitch.")! We specialize in Custom Tailoring, Aso-Ebi, Traditional Wear, Ankara Styles, Corporate Wear, Bridal Gowns, and Children's Clothing at ${settings.address} How can I help you with outfit pricing, fabric care, or booking an appointment today?`;
}

const QUICK_PROMPTS = [
  'What are your outfit prices in ₦?',
  'Which fabric is best for Aso-Ebi?',
  'Where is your studio in Ado Ekiti?',
  'How do I book & download my PDF?',
];

export const LiveChatWidget: React.FC<LiveChatWidgetProps> = ({
  settings,
  onNavigateToBooking,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      text: `Hello! Welcome to EUCHARIA Stitches. I am your AI Fashion Concierge. Ask me anything about our collections, starting prices in Naira (₦), our Fabric Library care guides, studio hours in Ado Ekiti, or booking your bespoke outfit!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: updatedHistory.map((m) => ({ role: m.role, text: m.text })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          text: data.reply || generateLocalAccurateAnswer(trimmed, settings),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error('Fallback to local concierge');
      }
    } catch {
      const fallbackReply = generateLocalAccurateAnswer(trimmed, settings);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: fallbackReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Live Chat Trigger Button (Left of WhatsApp Button) */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open EUCHARIA Stitches AI Live Chat"
        className="fixed bottom-5 right-44 sm:right-52 z-40 inline-flex items-center gap-2 px-4 py-3 rounded-full bg-[#C5A059] text-[#1A1412] border border-[#1A1412]/20 shadow-lg hover:bg-[#d4b26c] transition-transform duration-200 hover:-translate-y-0.5"
      >
        {isOpen ? (
          <X className="w-5 h-5 text-[#1A1412]" />
        ) : (
          <MessageSquare className="w-5 h-5 text-[#1A1412]" />
        )}
        <span className="text-xs font-bold whitespace-nowrap">Live AI Chat</span>
      </button>

      {/* Live Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-5 z-50 w-[350px] sm:w-[390px] max-h-[540px] bg-[#FAF7F2] border border-[#C5A059] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-[#1A1412] text-[#FAF7F2] px-4 py-3.5 flex items-center justify-between border-b border-[#C5A059]/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#C5A059] text-[#1A1412] flex items-center justify-center font-serif-display font-bold text-sm">
                ES
              </div>
              <div>
                <p className="font-serif-display text-base font-semibold text-white leading-none flex items-center gap-1.5">
                  EUCHARIA AI Stylist
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                </p>
                <p className="text-[11px] text-[#C5A059] mt-0.5">
                  Instant Answers · Fabrics, Pricing & Bookings
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-[#D6CEC2] hover:text-white rounded-lg"
              aria-label="Close Live Chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[320px]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'bg-[#1A1412] text-[#FAF7F2]'
                      : 'bg-white border border-[#E6DEC8] text-[#1A1412]'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-[#7A6B63] mt-1 px-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-start">
                <div className="bg-white border border-[#E6DEC8] rounded-xl px-3.5 py-2 text-xs text-[#9E7B36] italic">
                  EUCHARIA AI Concierge is typing...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggested Questions */}
          <div className="px-3 py-2 bg-[#F5EFE6] border-t border-[#E6DEC8] flex items-center gap-1.5 overflow-x-auto">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendMessage(prompt)}
                className="px-2.5 py-1 bg-white border border-[#E6DEC8] rounded-md text-[11px] text-[#1A1412] hover:border-[#C5A059] whitespace-nowrap shrink-0 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="p-3 bg-white border-t border-[#E6DEC8] flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about outfits, fabrics, prices..."
              className="flex-1 px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg text-[#1A1412] focus:outline-none focus:border-[#C5A059]"
            />
            <button
              type="submit"
              disabled={isTyping || !input.trim()}
              className="p-2 bg-[#1A1412] text-[#C5A059] rounded-lg hover:bg-[#2C211D] disabled:opacity-40 transition-colors"
              aria-label="Send Chat Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Bottom Direct Booking Bar */}
          <div className="bg-[#F5EFE6] px-4 py-2 border-t border-[#E6DEC8] flex items-center justify-between text-[11px]">
            <span className="text-[#5C4E47] flex items-center gap-1">
              <Scissors className="w-3 h-3 text-[#9E7B36]" />
              Ready to commission an outfit?
            </span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onNavigateToBooking();
              }}
              className="font-semibold text-[#9E7B36] hover:underline"
            >
              Book Appointment →
            </button>
          </div>
        </div>
      )}
    </>
  );
};
