import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Phone,
  Clock,
  Send,
  MessageSquare,
  HelpCircle,
  ChevronDown,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Headphones,
  ShieldCheck,
} from 'lucide-react';

import Input from '../../Components/common/Input';
import Button from '../../Components/common/Button';
import { useToast } from '../../context/ToastContext';

export const ContactUsPage = () => {
  const { success, error } = useToast();

  const [form, setFormData] = useState({
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
      a: 'Vyapix is a business management platform that helps retailers manage billing, GST invoices, inventory, products and business reports from one place.',
    },
    {
      q: 'Can I use Vyapix for my retail store?',
      a: 'Yes. Vyapix is designed for different types of retail businesses including grocery stores, supermarkets, electronics stores, apparel stores, pharmacies and more.',
    },
    {
      q: 'Can I use a barcode scanner with Vyapix?',
      a: 'Yes. Standard USB and Bluetooth barcode scanners can be used for faster product search and billing.',
    },
    {
      q: 'Can multiple cashiers use Vyapix?',
      a: 'Yes. Store owners can create separate cashier accounts and manage billing operations across multiple counters.',
    },
    {
      q: 'Can I generate GST invoices?',
      a: 'Yes. Vyapix supports GST-based billing and invoice generation with tax details included in the invoice.',
    },
    {
      q: 'How can I get help with Vyapix?',
      a: 'You can contact us using the form on this page. Our team can help with account setup, billing, inventory and technical questions.',
    },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.message.trim()
    ) {
      error('Please complete your name, email, and message.');
      return;
    }

    setSubmitting(true);

    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);

      success(
        'Thank you! Your message has been sent successfully.'
      );

      setFormData({
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
    <div className="bg-white">

      <section className="relative overflow-hidden">

        <div
          className="
            max-w-6xl
            mx-auto
            px-5 sm:px-6 lg:px-8
            pt-16 sm:pt-20
            pb-12
            text-center
          "
        >

          <div
            className="
              inline-flex
              items-center
              gap-2
              px-3.5 py-1.5
              rounded-full
              bg-orange-50
              border border-orange-100
              text-orange-600
              text-xs sm:text-sm
              font-semibold
            "
          >
            <Sparkles className="w-3.5 h-3.5" />
            We're here to help
          </div>

          <h1
            className="
              mt-6
              text-3xl
              sm:text-4xl
              lg:text-5xl
              font-bold
              tracking-tight
              text-slate-900
            "
          >
            Let's talk about your
            <span className="text-orange-500"> business.</span>
          </h1>

          <p
            className="
              mt-5
              max-w-2xl
              mx-auto
              text-sm
              sm:text-base
              lg:text-lg
              leading-relaxed
              text-slate-600
            "
          >
            Have a question about billing, inventory, invoices or
            getting started with Vyapix? Our team is ready to help.
          </p>

        </div>

      </section>

      <section className="pb-16 sm:pb-20">

        <div
          className="
            max-w-6xl
            mx-auto
            px-5 sm:px-6 lg:px-8
            grid
            lg:grid-cols-12
            gap-8
            items-start
          "
        >

          <div className="lg:col-span-5">

            <div className="space-y-4">

              <div
                className="
                  group
                  p-5
                  rounded-2xl
                  border border-slate-200
                  bg-white
                  hover:border-orange-200
                  hover:shadow-lg
                  hover:shadow-orange-100/40
                  transition-all
                "
              >

                <div className="flex items-start gap-4">

                  <div
                    className="
                      w-11 h-11
                      rounded-xl
                      bg-orange-50
                      text-orange-500
                      flex items-center justify-center
                      shrink-0
                    "
                  >
                    <Mail className="w-5 h-5" />
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Email Support
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Send us your questions or feedback.
                    </p>

                    <a
                      href="mailto:support@vyapix.com"
                      className="
                        inline-block
                        mt-2
                        text-sm
                        font-semibold
                        text-orange-600
                        hover:text-orange-700
                      "
                    >
                      support@vyapix.com
                    </a>
                  </div>

                </div>

              </div>

              {/* Phone */}
              <div
                className="
                  group
                  p-5
                  rounded-2xl
                  border border-slate-200
                  bg-white
                  hover:border-orange-200
                  hover:shadow-lg
                  hover:shadow-orange-100/40
                  transition-all
                "
              >

                <div className="flex items-start gap-4">

                  <div
                    className="
                      w-11 h-11
                      rounded-xl
                      bg-orange-50
                      text-orange-500
                      flex items-center justify-center
                      shrink-0
                    "
                  >
                    <Phone className="w-5 h-5" />
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Phone & WhatsApp
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Talk to our support team directly.
                    </p>

                    <a
                      href="tel:+919876543210"
                      className="
                        inline-block
                        mt-2
                        text-sm
                        font-semibold
                        text-orange-600
                        hover:text-orange-700
                      "
                    >
                      +91 98765 43210
                    </a>
                  </div>

                </div>

              </div>

              {/* Working Hours */}
              <div
                className="
                  group
                  p-5
                  rounded-2xl
                  border border-slate-200
                  bg-white
                  hover:border-orange-200
                  hover:shadow-lg
                  hover:shadow-orange-100/40
                  transition-all
                "
              >

                <div className="flex items-start gap-4">

                  <div
                    className="
                      w-11 h-11
                      rounded-xl
                      bg-orange-50
                      text-orange-500
                      flex items-center justify-center
                      shrink-0
                    "
                  >
                    <Clock className="w-5 h-5" />
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Support Hours
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Monday – Saturday
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      9:00 AM – 8:00 PM IST
                    </p>
                  </div>

                </div>

              </div>

            </div>

            {/* Small trust card */}
            <div
              className="
                mt-4
                p-5
                rounded-2xl
                bg-orange-50
                border border-orange-100
              "
            >

              <div className="flex gap-3">

                <ShieldCheck className="w-5 h-5 text-orange-500 shrink-0" />

                <div>

                  <h3 className="text-sm font-semibold text-slate-900">
                    Need help getting started?
                  </h3>

                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    Tell us about your business and we'll help you
                    understand how Vyapix can fit your workflow.
                  </p>

                </div>

              </div>

            </div>

          </div>

          {/* =================================================
              RIGHT SIDE FORM
          ================================================= */}
          <div
            className="
              lg:col-span-7
              rounded-2xl
              border border-slate-200
              bg-white
              shadow-xl
              shadow-slate-200/40
              p-6
              sm:p-8
            "
          >

            {submitted ? (

              <div
                className="
                  min-h-[420px]
                  flex
                  flex-col
                  items-center
                  justify-center
                  text-center
                  px-5
                "
              >

                <div
                  className="
                    w-16 h-16
                    rounded-full
                    bg-orange-50
                    text-orange-500
                    flex
                    items-center
                    justify-center
                  "
                >
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <h2
                  className="
                    mt-5
                    text-xl
                    sm:text-2xl
                    font-bold
                    text-slate-900
                  "
                >
                  Message sent successfully!
                </h2>

                <p
                  className="
                    mt-2
                    max-w-md
                    text-sm
                    leading-relaxed
                    text-slate-500
                  "
                >
                  Thank you for contacting Vyapix. Our team will
                  review your message and get back to you shortly.
                </p>

                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="
                    mt-6
                    text-sm
                    font-semibold
                    text-orange-600
                    hover:text-orange-700
                  "
                >
                  Send another message
                </button>

              </div>

            ) : (

              <>
                {/* Form Header */}
                <div className="mb-6">

                  <div
                    className="
                      w-11 h-11
                      rounded-xl
                      bg-orange-50
                      text-orange-500
                      flex items-center justify-center
                    "
                  >
                    <MessageSquare className="w-5 h-5" />
                  </div>

                  <h2
                    className="
                      mt-4
                      text-xl
                      sm:text-2xl
                      font-bold
                      text-slate-900
                    "
                  >
                    Send us a message
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Fill out the form and we'll get back to you.
                  </p>

                </div>

                <form
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >

                  {/* Name + Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <Input
                      label="Your Name"
                      name="name"
                      placeholder="Your name"
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

                  {/* Phone + Business */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <Input
                      label="Phone Number"
                      name="phone"
                      placeholder="9876543210"
                      value={form.phone}
                      onChange={handleChange}
                    />

                    <Input
                      label="Business Name"
                      name="shopName"
                      placeholder="Your business name"
                      value={form.shopName}
                      onChange={handleChange}
                    />

                  </div>

                  {/* Topic */}
                  <div>

                    <label
                      className="
                        block
                        text-sm
                        font-medium
                        text-slate-700
                        mb-1.5
                      "
                    >
                      How can we help?
                    </label>

                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      className="
                        w-full
                        h-11
                        rounded-lg
                        border border-slate-300
                        bg-white
                        text-slate-900
                        px-3
                        text-sm
                        focus:outline-none
                        focus:ring-2
                        focus:ring-orange-100
                        focus:border-orange-500
                      "
                    >
                      <option value="general">
                        General Inquiry
                      </option>

                      <option value="billing">
                        Billing & Invoicing
                      </option>

                      <option value="inventory">
                        Inventory Management
                      </option>

                      <option value="hardware">
                        Printer & Barcode Scanner
                      </option>

                      <option value="account">
                        Account & Login
                      </option>

                      <option value="technical">
                        Technical Support
                      </option>
                    </select>

                  </div>

                  {/* Message */}
                  <div>

                    <label
                      className="
                        block
                        text-sm
                        font-medium
                        text-slate-700
                        mb-1.5
                      "
                    >
                      Message
                      <span className="text-red-500 ml-1">*</span>
                    </label>

                    <textarea
                      name="message"
                      rows={5}
                      placeholder="Tell us how we can help..."
                      value={form.message}
                      onChange={handleChange}
                      required
                      className="
                        w-full
                        rounded-lg
                        border border-slate-300
                        bg-white
                        text-slate-900
                        p-3
                        text-sm
                        resize-none
                        focus:outline-none
                        focus:ring-2
                        focus:ring-orange-100
                        focus:border-orange-500
                        placeholder:text-slate-400
                      "
                    />

                  </div>

                  {/* Submit */}
                  <div className="pt-1">

                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      loading={submitting}
                      icon={Send}
                      iconPosition="right"
                    >
                      Send Message
                    </Button>

                  </div>

                </form>
              </>

            )}

          </div>

        </div>

      </section>

      {/* =====================================================
          FAQ
      ===================================================== */}
      <section className="py-16 sm:py-20 bg-slate-50">

        <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8">

          {/* Heading */}
          <div className="text-center">

            <div
              className="
                inline-flex
                items-center
                gap-2
                text-xs
                font-bold
                uppercase
                tracking-wider
                text-orange-600
              "
            >
              <HelpCircle className="w-4 h-4" />
              Frequently Asked Questions
            </div>

            <h2
              className="
                mt-3
                text-2xl
                sm:text-3xl
                font-bold
                tracking-tight
                text-slate-900
              "
            >
              Have questions? We've got answers.
            </h2>

            <p className="mt-3 text-sm sm:text-base text-slate-600">
              Find quick answers to common questions about Vyapix.
            </p>

          </div>

          {/* FAQ */}
          <div className="mt-10 space-y-3">

            {faqs.map((faq, index) => {

              const isOpen = openFaq === index;

              return (
                <div
                  key={faq.q}
                  className="
                    bg-white
                    border border-slate-200
                    rounded-xl
                    overflow-hidden
                  "
                >

                  <button
                    type="button"
                    onClick={() =>
                      setOpenFaq(isOpen ? -1 : index)
                    }
                    className="
                      w-full
                      px-5 py-4
                      flex
                      items-center
                      justify-between
                      gap-4
                      text-left
                      hover:bg-orange-50/50
                      transition-colors
                    "
                  >

                    <span
                      className="
                        text-sm
                        sm:text-base
                        font-semibold
                        text-slate-900
                      "
                    >
                      {faq.q}
                    </span>

                    <ChevronDown
                      className={`
                        w-5 h-5
                        shrink-0
                        text-slate-400
                        transition-transform
                        duration-200
                        ${
                          isOpen
                            ? 'rotate-180 text-orange-500'
                            : ''
                        }
                      `}
                    />

                  </button>

                  {isOpen && (
                    <div
                      className="
                        px-5
                        pb-5
                        pt-1
                        text-sm
                        leading-relaxed
                        text-slate-600
                        border-t
                        border-slate-100
                      "
                    >
                      {faq.a}
                    </div>
                  )}

                </div>
              );
            })}

          </div>

        </div>

      </section>

      {/* =====================================================
          BOTTOM CTA
      ===================================================== */}
      <section className="py-16 sm:py-20">

        <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">

          <div
            className="
              rounded-3xl
              bg-slate-900
              px-6 py-12
              sm:px-10
              text-center
            "
          >

            <div className="flex justify-center">

              <div
                className="
                  w-12 h-12
                  rounded-xl
                  bg-orange-500
                  text-white
                  flex items-center justify-center
                "
              >
                <Headphones className="w-6 h-6" />
              </div>

            </div>

            <h2
              className="
                mt-5
                text-2xl
                sm:text-3xl
                font-bold
                text-white
              "
            >
              Need help getting started?
            </h2>

            <p
              className="
                mt-3
                max-w-xl
                mx-auto
                text-sm
                sm:text-base
                text-slate-400
              "
            >
              Start using Vyapix today or reach out to our team
              if you have any questions.
            </p>

            <div className="mt-7 flex flex-wrap justify-center gap-3">

              <Link to="/register">
                <Button
                  variant="primary"
                  size="md"
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  Start Free
                </Button>
              </Link>

              <Link to="/about">
                <Button variant="outline" size="md">
                  Learn More About Vyapix
                </Button>
              </Link>

            </div>

          </div>

        </div>

      </section>

    </div>
  );
};

export default ContactUsPage;