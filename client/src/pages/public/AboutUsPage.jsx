import { Link } from 'react-router-dom';
import Button from '../../Components/common/Button';

export const AboutUsPage = () => {
  const features = [
    {
      title: 'Easy GST Billing',
      desc: 'Create invoices with GST details and tax calculations.',
    },
    {
      title: 'Inventory Management',
      desc: 'Manage products and keep track of available stock.',
    },
    {
      title: 'Business Reports',
      desc: 'Review sales and keep your business records organised.',
    },
    {
      title: 'Fast POS Billing',
      desc: 'Make everyday counter billing quick and easy.',
    },
    {
      title: 'Invoice Printing',
      desc: 'Print invoices on thermal printers or A4 paper.',
    },
    {
      title: 'Multiple Counters',
      desc: 'Manage billing counters and cashier accounts.',
    },
  ];

  const businessTypes = [
    'Kirana and Grocery Stores',
    'Supermarkets and Marts',
    'Electronics and Hardware',
    'Apparel and Footwear',
    'Bakeries and Sweet Shops',
    'Pharmacies and Health Stores',
  ];

  const benefits = [
    'Easy-to-use interface',
    'GST billing',
    'Inventory management',
    'Invoice generation',
    'Sales reports',
    'Multiple user support',
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-100">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=2000&q=85')",
          }}
        />

        <div className="absolute inset-0 bg-white/90" />

        <div className="relative mx-auto max-w-6xl px-5 py-20 text-center sm:py-24">
          <p className="text-sm font-semibold uppercase tracking-widest text-orange-600">
            About Vyapix
          </p>

          <h1 className="mt-4 font-heading text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            Simple Billing.
            <span className="text-orange-500"> Smarter Business.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Vyapix helps retailers manage billing, inventory, invoices, and
            daily business activities in one place.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/register">
              <Button variant="primary" size="md" className="!rounded-none">
                Get Started
              </Button>
            </Link>

            <Link to="/contact">
              <Button variant="secondary" size="md" className="!rounded-none hover:text-black">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-8 sm:grid-cols-4 sm:px-8">
          {[
            { title: 'Fast', desc: 'Billing' },
            { title: 'Easy', desc: 'GST Invoices' },
            { title: 'Smart', desc: 'Inventory' },
            { title: 'Simple', desc: 'Reports' },
          ].map((item) => (
            <div key={item.title} className="text-center">
              <h3 className="font-heading text-2xl font-bold text-slate-900">
                {item.title}
              </h3>

              <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About Vyapix */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-orange-600">
              Who We Are
            </p>

            <h2 className="mt-3 font-heading text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
              Helping businesses manage their daily work.
            </h2>

            <p className="mt-5 text-base leading-7 text-slate-600">
              Running a shop involves billing customers, managing products,
              checking stock, and tracking sales. Managing everything manually
              can take time.
            </p>

            <p className="mt-4 text-base leading-7 text-slate-600">
              Vyapix brings these tasks together to help retailers manage their
              everyday business activities more easily.
            </p>

            <div className="mt-7">
              <Link to="/features/billing">
                <Button variant="primary" size="md" className="!rounded-none">
                  Explore Features
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                title: 'Save Time',
                desc: 'Complete daily billing with less manual work.',
              },
              {
                title: 'Track Sales',
                desc: 'Review sales and business activity.',
              },
              {
                title: 'Manage Stock',
                desc: 'Keep product information organised.',
              },
              {
                title: 'Stay Organised',
                desc: 'Manage daily operations in one place.',
              },
            ].map((item, index) => (
              <div
                key={item.title}
                className={`border border-slate-200 p-6 ${
                  index === 0 || index === 3 ? 'bg-orange-50' : 'bg-white'
                }`}
              >
                <h3 className="font-heading text-lg font-semibold text-slate-900">
                  {item.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-slate-100 bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-orange-600">
              Our Features
            </p>

            <h2 className="mt-3 font-heading text-3xl font-bold text-slate-900 sm:text-4xl">
              What You Can Do with Vyapix
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Simple tools to help you manage everyday billing and inventory.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="border border-slate-200 bg-white p-6 transition hover:border-orange-400"
              >
                <h3 className="font-heading text-lg font-semibold text-slate-900">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link to="/features/billing">
              <Button variant="primary" size="md" className="!rounded-none">
                Explore All Features
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Business Types */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 sm:px-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-orange-600">
              Who Can Use Vyapix?
            </p>

            <h2 className="mt-3 font-heading text-3xl font-bold text-slate-900 sm:text-4xl">
              Designed for shops and growing businesses.
            </h2>

            <p className="mt-5 text-base leading-7 text-slate-600">
              From grocery stores to electronics shops, Vyapix helps retailers
              organise their billing, products, and daily operations.
            </p>

            <div className="mt-7">
              <Link to="/solutions/retail">
                <Button variant="primary" size="md" className="!rounded-none">
                  Explore Solutions
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {businessTypes.map((business) => (
              <div
                key={business}
                className="border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 transition hover:border-orange-400"
              >
                {business}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-y border-slate-200 bg-orange-50 py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 sm:px-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-orange-600">
              Why Vyapix?
            </p>

            <h2 className="mt-3 font-heading text-3xl font-bold text-slate-900 sm:text-4xl">
              Everything organised in one place.
            </h2>

            <p className="mt-4 text-base leading-7 text-slate-600">
              Manage billing, stock, and sales with simple tools designed for
              everyday business needs.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="border border-orange-100 bg-white p-4 text-sm font-medium text-slate-700"
              >
                {benefit}
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default AboutUsPage;