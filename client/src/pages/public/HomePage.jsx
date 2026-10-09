import React from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowRight,
    CheckCircle2,
    FileText,
    Package,
    ShoppingCart,
    BarChart3,
    Receipt,
    Users,
    Zap,
    Store,
    ShieldCheck,
    TrendingUp,
} from 'lucide-react';

const features = [
    {
        icon: FileText,
        title: 'GST Billing & Invoicing',
        description:
            'Create professional invoices and simplify your everyday billing operations.',
    },
    {
        icon: Package,
        title: 'Inventory Management',
        description:
            'Manage products, monitor stock levels, and organize your inventory.',
    },
    {
        icon: ShoppingCart,
        title: 'Fast POS Billing',
        description:
            'Make counter billing simpler with a smooth and efficient workflow.',
    },
    {
        icon: BarChart3,
        title: 'Business Reports',
        description:
            'Understand your sales and business performance through useful reports.',
    },
    {
        icon: Receipt,
        title: 'Invoice Generation',
        description:
            'Generate professional invoices for your everyday transactions.',
    },
    {
        icon: Users,
        title: 'Multiple Cashiers',
        description:
            'Manage separate cashier accounts for your store billing operations.',
    },
];

const benefits = [
    {
        icon: Zap,
        title: 'Save Time',
        description: 'Simplify repetitive billing tasks.',
    },
    {
        icon: ShieldCheck,
        title: 'Stay Organized',
        description: 'Keep business information organized.',
    },
    {
        icon: TrendingUp,
        title: 'Understand Sales',
        description: 'Review sales and business reports.',
    },
];

const HomePage = () => {
    return (
        <div className="overflow-hidden bg-white text-slate-900">

            {/* ================= HERO + FULL-WIDTH BACKGROUND IMAGE ================= */}
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

                    {/* White overlay behind text for readability */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/75 to-sky-50/10" />
                </div>

                {/* Hero Text */}
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

                    {/* Buttons */}
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
                <div className="relative z-10 mt-8 h-[180px] w-full sm:mt-0 sm:h-[260px] md:h-340px] lg:h-[240px]">

                    {/* Transparent image layer: shows the shops at the bottom */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-sky-50/10" />

                </div>

            </section>


            {/* ================= BUSINESS BENEFITS ================= */}
            <section className="border-y border-slate-100 bg-white">
                <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-5 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">

                    {benefits.map((benefit, index) => {
                        const Icon = benefit.icon;

                        const images = [
                            "/images/time.png",
                            "/images/organize.png",
                            "/images/understand.png",
                        ];

                        return (
                            <div
                                key={benefit.title}
                                className="group overflow-hidden  border border-slate-100 bg-white transition-all duration-300 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-100/50"
                            >
                                {/* Image */}
                                <div className="relative h-48 overflow-hidden bg-orange-50">
                                    <img
                                        src={images[index % images.length]}
                                        alt={benefit.title}
                                        className="h-full w-full object-cover transition-transform duration-500"
                                        loading="lazy"
                                    />
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <h3 className="font-heading text-xl font-bold tracking-tight text-slate-900 transition-colors group-hover:text-orange-600">
                                        {benefit.title}
                                    </h3>

                                    <p className="mt-3 font-sans text-sm leading-7 text-slate-600">
                                        {benefit.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })}

                </div>
            </section>


            {/* ================= FEATURES ================= */}

            <section className="bg-slate-50 py-16 sm:py-20 lg:py-24">
                <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">

                    {/* Section Heading */}
                    <div className="mx-auto max-w-2xl text-center">

                        <span className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-orange-600 sm:text-sm">
                            Everything in One Place
                        </span>

                        <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                            Powerful Features for Your Business
                        </h2>

                        <p className="mt-5 font-sans text-sm leading-7 text-slate-600 sm:text-base">
                            Simplify billing, manage inventory, track sales, and understand
                            your business performance with powerful tools designed for you.
                        </p>

                    </div>

                    <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3">

                        {features.map((feature, index) => {
                            const Icon = feature.icon;

                            const images = [
                                "/images/gst.png",
                                "/images/invetory.png",
                                "/images/pos.png",
                                "/images/business.png",
                                "/images/invoice.png",
                                "/images/cachier.png"
                            ];

                            return (
                                <article
                                    key={feature.title}
                                    className="group overflow-hidden border border-slate-200/80 bg-white transition-all duration-300 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-100/60"
                                >

                                    <div className="relative h-48 overflow-hidden bg-orange-50 sm:h-52">

                                        <img
                                            src={images[index % images.length]}
                                            alt={feature.title}
                                            loading="lazy"
                                            className="h-full w-full object-cover transition-transform duration-700"
                                        />

                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />

                                    </div>

                                    <div className="p-6 sm:p-7">

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

                    <div className="mt-12 text-center">

                        <Link
                            to="/about"
                            className="group inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 font-sans text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-xl hover:shadow-orange-500/30"
                        >
                            Learn More About Vyapix

                            <ArrowRight
                                size={17}
                                className="transition-transform duration-300 group-hover:translate-x-1"
                            />
                        </Link>

                    </div>

                </div>
            </section>

        </div>
    );
};

export default HomePage;