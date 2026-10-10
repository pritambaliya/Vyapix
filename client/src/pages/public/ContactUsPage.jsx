import { useState } from 'react';
import { Link } from 'react-router-dom';
import Input from '../../Components/common/Input';
import Button from '../../Components/common/Button';
import { useToast } from '../../context/ToastContext';

export const ContactUsPage = () => {
  const { success, error } = useToast();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    shopName: '',
    category: 'general',
    message: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const faqs = [
    {
      q: 'What is Vyapix?',
      a: 'Vyapix helps retailers manage billing, GST invoices, inventory and business reports in one place.',
    },
    {
      q: 'Can I use Vyapix for my shop?',
      a: 'Yes, Vyapix is designed for grocery stores, supermarkets, electronics shops, pharmacies and other retail businesses.',
    },
    {
      q: 'Can I generate GST invoices?',
      a: 'Yes, Vyapix supports GST billing and invoice generation with tax details.',
    },
    {
      q: 'Can multiple cashiers use Vyapix?',
      a: 'Yes, store owners can create separate cashier accounts to manage billing counters.',
    },
    {
      q: 'Can I use a barcode scanner?',
      a: 'Standard compatible USB and Bluetooth barcode scanners can be used for product search and billing.',
    },
    {
      q: 'How can I get support?',
      a: 'You can contact us through the form on this page for help with billing, inventory and account-related questions.',
    },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      error('Please enter your name, email and message.');
      return;
    }

    setSubmitting(true);

    // Replace this with your API request when the backend is ready.
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      success('Thank you! Your message has been submitted.');

      setForm({
        name: '',
        email: '',
        phone: '',
        shopName: '',
        category: 'general',
        message: '',
      });
    }, 400);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-100">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('../../../public/images/local.png')",
          }}
        />

        <div className="absolute inset-0 bg-white/90" />

        <div className="relative mx-auto max-w-3xl px-5 py-16 text-center sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-orange-600">
            Contact Us
          </p>

          <h1 className="mt-4 font-heading text-4xl font-bold text-slate-900 sm:text-5xl">
            How can we help you?
          </h1>

          <p className="mt-5 text-base leading-7 text-slate-600">
            Have questions about Vyapix? Contact us for help with billing,
            inventory or getting started with your business.
          </p>
        </div>
      </section>

      {/* Contact Details and Form */}
      <section className="px-5 py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-3">
          {/* Contact Details */}
          <div className="space-y-5">
            <div className="border border-slate-200 bg-white p-5">
              <h2 className="font-heading font-semibold">
                Email Support
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Send us your questions or feedback.
              </p>

              <a
                href="mailto:support@vyapix.com"
                className="mt-3 inline-block text-sm font-medium text-orange-600 hover:text-orange-700"
              >
                support@vyapix.com
              </a>
            </div>

            <div className="border border-slate-200 bg-white p-5">
              <h2 className="font-heading font-semibold">
                Phone Support
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Contact our support team.
              </p>

              <a
                href="tel:+919876543210"
                className="mt-3 inline-block text-sm font-medium text-orange-600 hover:text-orange-700"
              >
                +91 98765 43210
              </a>
            </div>

            <div className="border border-slate-200 bg-white p-5">
              <h2 className="font-heading font-semibold">
                Support Hours
              </h2>

              <p className="mt-2 text-sm text-slate-600">
                Monday – Saturday
              </p>

              <p className="mt-1 text-sm font-medium text-slate-700">
                9:00 AM – 8:00 PM IST
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="contact-container-enter border border-slate-200 bg-white p-5 sm:p-8 lg:col-span-2">
            {submitted ? (
              <div className="py-12 text-center">
                <h2 className="font-heading text-2xl font-bold text-slate-900">
                  Thank you for contacting us!
                </h2>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Your message has been submitted successfully.
                </p>

                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-5 text-sm font-semibold text-orange-600 hover:text-orange-700"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <>
                <h2 className="font-heading text-2xl font-bold text-slate-900">
                  Send us a message
                </h2>

                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Fill in the details below and tell us how we can help.
                </p>

                <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                  {/* Name and Email */}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Input
                      label="Your Name"
                      name="name"
                      placeholder="Enter your name"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />

                    <Input
                      label="Email Address"
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Phone and Business */}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Input
                      label="Phone Number"
                      name="phone"
                      type="tel"
                      placeholder="Enter phone number"
                      value={form.phone}
                      onChange={handleChange}
                    />

                    <Input
                      label="Business Name"
                      name="shopName"
                      placeholder="Enter business name"
                      value={form.shopName}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label
                      htmlFor="category"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      How can we help?
                    </label>

                    <select
                      id="category"
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      className="contact-field h-12 w-full border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="billing">Billing & Invoicing</option>
                      <option value="inventory">Inventory Management</option>
                      <option value="hardware">Printer & Barcode Scanner</option>
                      <option value="account">Account & Login</option>
                      <option value="technical">Technical Support</option>
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label
                      htmlFor="message"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Message <span className="text-red-500">*</span>
                    </label>

                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      placeholder="Write your message here..."
                      value={form.message}
                      onChange={handleChange}
                      required
                      className="contact-field w-full resize-none border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    loading={submitting}
                    className="!rounded-none"
                  >
                    Send Message
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="border-y border-slate-100 bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-5">
          <div className="text-center">
            <h2 className="font-heading text-3xl font-bold text-slate-900">
              Frequently Asked Questions
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
              Find answers to common questions about Vyapix.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={faq.q}
                className="border border-slate-200 bg-white"
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenFaq(openFaq === index ? -1 : index)
                  }
                  aria-expanded={openFaq === index}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm font-semibold text-slate-900 sm:text-base">
                    {faq.q}
                  </span>

                  <span className="text-xl text-orange-600">
                    {openFaq === index ? '−' : '+'}
                  </span>
                </button>

                {openFaq === index && (
                  <div className="border-t border-slate-100 px-5 py-4 text-sm leading-7 text-slate-600">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Input Styling */}
      <style>{`
        .contact-container-enter input,
        .contact-container-enter textarea,
        .contact-container-enter select {
          border-radius: 0 !important;
          background-color: #ffffff !important;
          color: #111827 !important;
          border-color: #d1d5db;
        }

        .contact-container-enter input::placeholder,
        .contact-container-enter textarea::placeholder {
          color: #111827 !important;
          opacity: 1;
        }

        .contact-container-enter input:focus,
        .contact-container-enter textarea:focus,
        .contact-container-enter select:focus {
          border-color: #f97316 !important;
          outline: none;
          box-shadow: 0 0 0 2px rgb(249 115 22 / 12%);
        }

        .contact-container-enter {
          animation: contactFormEnter 0.5s ease-out;
        }

        @keyframes contactFormEnter {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .contact-container-enter {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

export default ContactUsPage;