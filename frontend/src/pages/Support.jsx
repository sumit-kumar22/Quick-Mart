import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { HelpCircle, MessageCircle, Phone, ChevronDown, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { ORDER_ISSUES } from '../utils/constants.js';
import { useToast } from '../context/ToastContext.jsx';
import { cn } from '../utils/cn.js';

const FAQS = [
  { q: 'How fast is the delivery?', a: 'We deliver within 10-20 minutes in most serviceable areas, depending on your proximity to the nearest QuickMart store.' },
  { q: 'What are the payment options?', a: 'We accept UPI (GPay, PhonePe, Paytm), credit/debit cards, net banking and Cash on Delivery.' },
  { q: 'How do I apply a coupon?', a: 'Add items to your cart, go to checkout and enter the coupon code in the "Apply Coupon" section before placing the order.' },
  { q: 'What is the free delivery threshold?', a: 'Delivery is free on orders above ₹499. A nominal delivery fee applies below that.' },
  { q: 'Can I cancel or modify my order?', a: 'You can cancel an order before it is picked up. Once the delivery partner is on the way, the order can no longer be cancelled.' },
  { q: 'How do I get a refund?', a: 'Refunds for cancelled or failed orders are processed to your original payment method within 3-5 business days.' },
];

export default function Support() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const orderId = location.state?.orderId || '';
  const [issue, setIssue] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [openFaq, setOpenFaq] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (orderId) setSubject(`Order #${orderId}`);
  }, [orderId]);

  const submit = (e) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSubmitted(true);
    }, 900);
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-success/10 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-success" />
        </div>
        <h1 className="mt-4 text-xl font-bold">Ticket created!</h1>
        <p className="mt-2 text-sm text-slate-500">Our support team will get back to you within a few hours. Track the response in your email.</p>
        <button onClick={() => { setSubmitted(false); setMessage(''); setIssue(''); }} className="btn-secondary mt-6">Create another ticket</button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">How can we help?</h1>
      <p className="text-sm text-slate-500 mb-8">We're here for you 24/7 — email, chat or a call.</p>

      <div className="grid md:grid-cols-3 gap-4 mb-10">
        {[
          { icon: MessageCircle, title: 'Live Chat', desc: 'Instant answers from our team', cta: 'Start Chat' },
          { icon: Phone, title: 'Call us', desc: '+91 98765 43210', cta: 'Call Now' },
          { icon: HelpCircle, title: 'Email', desc: 'hello@quickmart.co', cta: 'Send Email' },
        ].map((c) => (
          <button key={c.title} onClick={() => toast.show(`${c.title} support opening...`, 'info')} className="card p-5 text-left hover:shadow-cardHover transition group">
            <span className="h-11 w-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition">
              <c.icon size={20} />
            </span>
            <p className="font-semibold mt-3">{c.title}</p>
            <p className="text-xs text-slate-500 mt-0.5">{c.desc}</p>
            <p className="text-sm text-brand-600 font-semibold mt-2">{c.cta} →</p>
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* FAQ */}
        <div>
          <h2 className="text-lg font-bold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {FAQS.map((f, i) => (
              <div key={i} className="card overflow-hidden">
                <button onClick={() => setOpenFaq(i === openFaq ? -1 : i)} className="w-full flex items-center justify-between gap-3 p-4 text-left cursor-pointer hover:bg-slate-50">
                  <span className="text-sm font-semibold">{f.q}</span>
                  <ChevronDown size={16} className={cn('text-slate-400 transition-transform shrink-0', openFaq === i && 'rotate-180')} />
                </button>
                {openFaq === i && <p className="px-4 pb-4 text-sm text-slate-500 leading-relaxed">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Contact form */}
        <div className="card p-5 h-fit">
          <h2 className="text-lg font-bold mb-1">Raise a ticket</h2>
          <p className="text-xs text-slate-500 mb-4">Select an issue type and tell us what happened.</p>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Issue type</label>
              <select value={issue} onChange={(e) => setIssue(e.target.value)} className="input" required>
                <option value="">Select an issue...</option>
                {ORDER_ISSUES.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Subject</label>
              <input className="input" placeholder="Brief summary" value={subject} onChange={(e) => setSubject(e.target.value)} required />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input min-h-28" placeholder="Describe the issue in detail..." value={message} onChange={(e) => setMessage(e.target.value)} required />
            </div>
            <button type="submit" disabled={sending} className="btn-primary w-full justify-center">
              {sending ? <><AlertCircle size={16} className="animate-spin" /> Submitting...</> : <><Send size={16} /> Submit Ticket</>}
            </button>
            <p className="text-[11px] text-slate-400 text-center">Average response time: under 2 hours</p>
          </form>
        </div>
      </div>
    </div>
  );
}