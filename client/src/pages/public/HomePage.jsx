import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
    ArrowRight,
    FileText,
    Package,
    ShoppingCart,
    BarChart3,
    Receipt,
    Users,
    Zap,
    ShieldCheck,
    TrendingUp,
} from 'lucide-react';

const features = [
    {
        icon: FileText,
        title: 'GST Billing & Invoicing',
        description:
            'Create professional invoices and simplify your everyday billing operations.',
        image: '/images/gst.png',
        alt: 'GST billing and invoicing software',
    },
    {
        icon: Package,
        title: 'Inventory Management',
        description:
            'Manage products, monitor stock levels, and organize your inventory.',
        image: '/images/invetory.png',
        alt: 'Inventory and stock management software',
    },
    {
        icon: ShoppingCart,
        title: 'Fast POS Billing',
        description:
            'Make counter billing simpler with a smooth and efficient workflow.',
        image: '/images/pos.png',
        alt: 'Point of sale billing for retail shops',
    },
    {
        icon: BarChart3,
        title: 'Business Reports',
        description:
            'Understand your sales and business performance through useful reports.',
        image: '/images/business.png',
        alt: 'Business sales reports and performance tracking',
    },
    {
        icon: Receipt,
        title: 'Invoice Generation',
        description:
            'Generate professional invoices for your everyday transactions.',
        image: '/images/invoice.png',
        alt: 'Professional invoice generation software',
    },
    {
        icon: Users,
        title: 'Multiple Cashiers',
        description:
            'Manage separate cashier accounts for your store billing operations.',
        image: '/images/cachier.png',
        alt: 'Multiple cashier account management',
    },
];

const benefits = [
    {
        icon: Zap,
        title: 'Save Time',
        description: 'Simplify repetitive billing tasks.',
        image: '/images/time.png',
        alt: 'Save time with simpler business billing',
    },
    {
        icon: ShieldCheck,
        title: 'Stay Organized',
        description: 'Keep business information organized.',
        image: '/images/organize.png',
        alt: 'Keep business operations organized',
    },
    {
        icon: TrendingUp,
        title: 'Understand Sales',
        description: 'Review sales and business reports.',
        image: '/images/understand.png',
        alt: 'Understand business sales and performance',
    },
];

const HomePage = () => {
    return (
        <>
            {/* ================= SEO METADATA ================= */}
            <Helmet>
                <title>
                    Vyapix | GST Billing, Inventory & Business Management Software
                </title>

                <meta
                    name="description"
                    content="Simplify GST billing, invoice generation, inventory management, POS billing, and sales reporting with Vyapix business management software."
                />

                <meta
                    name="robots"
                    content="index, follow"
                />

                <meta
                    property="og:title"
                    content="Vyapix | Billing & Business Management Made Simple"
                />

                <meta
                    property="og:description"
                    content="Manage billing, inventory, invoices, and everyday business operations in one place with Vyapix."
                />

                <meta
                    property="og:type"
                    content="website"
                />

                {/* Replace this URL with your actual production domain */}
                <meta
                    property="og:url"
                    content="https://YOUR-DOMAIN.com/"
                />

                <meta
                    property="og:image"
                    content="https://YOUR-DOMAIN.com/images/vyapix-retail-banner.png"
                />

                {/* Replace this URL with your actual production domain */}
                <link
                    rel="canonical"
                    href="https://YOUR-DOMAIN.com/"
                />
            </Helmet>

            <div className="overflow-hidden bg-white text-slate-900">

                {/* ================= HERO SECTION ================= */}
                <section className="relative isolate overflow-hidden bg-gradient-to-b from-sky-50 via-white to-sky-50">

                    {/* Background Image */}
                    <div className="absolute inset-0 -z-10">
                        <img
                            src="/images/vyapix-retail-banner.png"
                            alt=""
                            aria-hidden="true"
                            fetchPriority="high"
                            className="absolute inset-0 h-full w-full object-cover object-bottom"
                        />

                        {/* White Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/75 to-sky-50/10" />
                    </div>

                    {/* Hero Content */}
                    <div className="relative z-10 mx-auto max-w-5xl px-5 pb-0 pt-14 text-center sm:px-6 sm:pt-20 lg:pt-24">

                        <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-6xl">
                            Billing & Business Management

                            <span className="mt-5 block text-orange-500">
                                Made Simple with Vyapix
                            </span>
                        </h1>

                        <p className="mx-auto mt-6 max-w-2xl font-sans text-lg leading-8 text-black">
                            Manage billing, inventory, invoices, and everyday business
                            operations in one place. Vyapix helps simplify your workflow
                            so you can focus on growing your business.
                        </p>

                        {/* CTA Buttons */}
                        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">

                            <Link
                                to="/register"
                                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-orange-500 px-7 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-orange-600"
                            >
                                Start Free
                                <ArrowRight size={18} />
                            </Link>

                            <Link
                                to="/about"
                                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-300 bg-white/90 px-7 py-3 text-sm font-semibold text-slate-700 transition hover:border-orange-300 hover:text-orange-600"
                            >
                                Explore Vyapix
                            </Link>

                        </div>
                    </div>

                    {/* Bottom Image Area */}
                    <div className="relative z-10 mt-8 h-[180px] w-full sm:mt-0 sm:h-[260px] md:h-[340px] lg:h-[240px]">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-sky-50/10" />
                    </div>

                </section>

                {/* ================= BUSINESS BENEFITS ================= */}
                <section
                    aria-labelledby="benefits-heading"
                    className="border-y border-slate-100 bg-white"
                >
                    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-5 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">

                        {benefits.map((benefit) => (
                            <article
                                key={benefit.title}
                                className="group overflow-hidden border border-slate-100 bg-white transition-all duration-300 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-100/50"
                            >
                                {/* Benefit Image */}
                                <div className="relative h-48 overflow-hidden bg-orange-50">
                                    <img
                                        src={benefit.image}
                                        alt={benefit.alt}
                                        loading="lazy"
                                        decoding="async"
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                </div>

                                {/* Benefit Content */}
                                <div className="p-6">
                                    <h2
                                        id={
                                            benefit.title === 'Save Time'
                                                ? 'benefits-heading'
                                                : undefined
                                        }
                                        className="font-heading text-xl font-bold tracking-tight text-slate-900 transition-colors group-hover:text-orange-600"
                                    >
                                        {benefit.title}
                                    </h2>

                                    <p className="mt-3 font-sans text-sm leading-7 text-slate-600">
                                        {benefit.description}
                                    </p>
                                </div>
                            </article>
                        ))}

                    </div>
                </section>

                {/* ================= FEATURES SECTION ================= */}
                <section
                    aria-labelledby="features-heading"
                    className="bg-slate-50 py-16 sm:py-20 lg:py-24"
                >
                    <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">

                        {/* Section Heading */}
                        <div className="mx-auto max-w-2xl text-center">

                            <span className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-orange-600 sm:text-sm">
                                Everything in One Place
                            </span>

                            <h2
                                id="features-heading"
                                className="mt-4 font-heading text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl"
                            >
                                Powerful Features for Your Business
                            </h2>

                            <p className="mt-5 font-sans text-sm leading-7 text-slate-600 sm:text-base">
                                Simplify billing, manage inventory, track sales, and understand
                                your business performance with powerful tools designed for you.
                            </p>

                        </div>

                        {/* Feature Cards */}
                        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3">

                            {features.map((feature) => {
                                const Icon = feature.icon;

                                return (
                                    <article
                                        key={feature.title}
                                        className="group overflow-hidden border border-slate-200/80 bg-white transition-all duration-300 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-100/60"
                                    >

                                        {/* Feature Image */}
                                        <div className="relative h-48 overflow-hidden bg-orange-50 sm:h-52">

                                            <img
                                                src={feature.image}
                                                alt={feature.alt}
                                                loading="lazy"
                                                decoding="async"
                                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            />

                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />

                                        </div>

                                        {/* Feature Content */}
                                        <div className="p-6 sm:p-7">

                                            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                                                <Icon size={22} aria-hidden="true" />
                                            </div>

                                            <h3 className="font-heading text-lg font-bold tracking-tight text-slate-900 transition-colors duration-300 group-hover:text-orange-600 sm:text-xl">
                                                {feature.title}
                                            </h3>

                                            <p className="mt-3 font-sans text-sm leading-7 text-slate-600">
                                                {feature.description}
                                            </p>

                                            <div className="mt-5 h-1 w-10 rounded-full bg-orange-200 transition-all duration-300 group-hover:w-16 group-hover:bg-orange-500" />

                                        </div>
                                    </article>
                                );
                            })}

                        </div>

                        {/* Learn More Button */}
                        <div className="mt-12 text-center">

                            <Link
                                to="/about"
                                className="group inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 font-sans text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-xl hover:shadow-orange-500/30"
                            >
                                Learn More About Vyapix

                                <ArrowRight
                                    size={17}
                                    aria-hidden="true"
                                    className="transition-transform duration-300 group-hover:translate-x-1"
                                />
                            </Link>

                        </div>

                    </div>
                </section>

            </div>
        </>
    );
};

export default HomePage;