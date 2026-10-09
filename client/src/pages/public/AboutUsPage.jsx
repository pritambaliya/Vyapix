import { Link } from 'react-router-dom';
import Button from '../../Components/common/Button';

export const AboutUsPage = () => {
const features = [
{
title: 'Easy GST Billing',
desc: 'Create GST invoices with automatic tax calculations.',
},
{
title: 'Inventory Management',
desc: 'Manage products and keep track of available stock.',
},
{
title: 'Business Reports',
desc: 'Check sales, purchases and business performance.',
},
{
title: 'Fast POS Billing',
desc: 'Make counter billing quick and easy.',
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

return ( <div className="bg-white font-sans">

  {/* Hero */}
  <section className="py-16 sm:py-20">
    <div className="mx-auto max-w-6xl px-5 text-center sm:px-6 lg:px-8">

      <p className="text-sm font-semibold text-orange-600">
        About Vyapix
      </p>

      <h1 className="mt-4 font-heading text-3xl font-bold text-slate-900 sm:text-4xl lg:text-5xl">
        Simple Billing.
        <span className="text-orange-500"> Smarter Business.</span>
      </h1>

      <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
        Vyapix helps retailers manage billing, inventory, invoices
        and daily business activities in one place.
      </p>

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link to="/register">
          <Button variant="primary" size="md">
            Start Free
          </Button>
        </Link>

        <Link to="/contact">
          <Button variant="secondary" size="md">
            Contact Us
          </Button>
        </Link>
      </div>

    </div>
  </section>

  {/* Highlights */}
  <section className="border-y border-slate-200 bg-slate-50">
    <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-8 sm:px-6 md:grid-cols-4 lg:px-8">

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
          <p className="mt-1 text-sm text-slate-500">
            {item.desc}
          </p>
        </div>
      ))}

    </div>
  </section>

  {/* About */}
  <section className="py-16 sm:py-20">
    <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">

      <div>
        <h2 className="font-heading text-2xl font-bold text-slate-900 sm:text-3xl">
          Helping businesses manage their daily work.
        </h2>

        <p className="mt-5 text-sm leading-7 text-slate-600 sm:text-base">
          Running a shop involves billing customers, managing products,
          checking stock and tracking sales. Managing everything manually
          can take time.
        </p>

        <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
          Vyapix brings these tasks together to make everyday business
          work easier for retailers.
        </p>

        <div className="mt-6">
          <Link to="/register">
            <Button variant="primary" size="md">
              Get Started
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">

        <div className="rounded-xl bg-orange-50 p-5">
          <h3 className="font-heading font-semibold text-slate-900">
            Save Time
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Complete daily billing with less manual work.
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-5">
          <h3 className="font-heading font-semibold text-slate-900">
            Track Sales
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Keep an eye on your sales and business activity.
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-5">
          <h3 className="font-heading font-semibold text-slate-900">
            Manage Stock
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Keep product information and stock organized.
          </p>
        </div>

        <div className="rounded-xl bg-orange-50 p-5">
          <h3 className="font-heading font-semibold text-slate-900">
            Grow Your Business
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Manage daily operations as your shop grows.
          </p>
        </div>

      </div>
    </div>
  </section>

  {/* Features */}
  <section className="bg-slate-50 py-16 sm:py-20">
    <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">

      <div className="text-center">
        <p className="text-sm font-semibold text-orange-600">
          Our Features
        </p>

        <h2 className="mt-3 font-heading text-2xl font-bold text-slate-900 sm:text-3xl">
          What You Can Do with Vyapix
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
          Everything you need to handle your daily billing and
          inventory work.
        </p>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-xl border border-slate-200 bg-white p-6 transition hover:border-orange-200"
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

    </div>
  </section>

  {/* Business Types */}
  <section className="py-16 sm:py-20">
    <div className="mx-auto grid max-w-6xl gap-8 px-5 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">

      <div>
        <p className="text-sm font-semibold text-orange-600">
          Who Can Use Vyapix?
        </p>

        <h2 className="mt-3 font-heading text-2xl font-bold text-slate-900 sm:text-3xl">
          For shops and growing businesses.
        </h2>

        <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
          Vyapix can help different types of retailers manage their
          billing, products and daily operations.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {businessTypes.map((business) => (
          <div
            key={business}
            className="rounded-lg border border-slate-200 p-4 text-sm font-medium text-slate-700"
          >
            {business}
          </div>
        ))}
      </div>

    </div>
  </section>

  {/* Benefits */}
  <section className="bg-orange-500 py-16 sm:py-20">
    <div className="mx-auto grid max-w-6xl gap-8 px-5 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">

      <div>
        <h2 className="font-heading text-2xl font-bold text-white sm:text-3xl">
          Why Choose Vyapix?
        </h2>

        <p className="mt-4 text-sm leading-7 text-orange-50 sm:text-base">
          Manage billing, stock and sales from one place without
          making your daily work complicated.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {benefits.map((benefit) => (
          <div
            key={benefit}
            className="rounded-lg border border-white/20 bg-white/10 p-4 text-sm font-medium text-white"
          >
            {benefit}
          </div>
        ))}
      </div>

    </div>
  </section>

  {/* Final Section */}
  <section className="py-16 sm:py-20">
    <div className="mx-auto max-w-4xl px-5 sm:px-6 lg:px-8">

      <div className="rounded-2xl bg-slate-900 px-6 py-12 text-center sm:px-10 sm:py-14">
        <h2 className="font-heading text-2xl font-bold text-white sm:text-3xl">
          Ready to manage your business better?
        </h2>

        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
          Try Vyapix and manage your billing and inventory in one place.
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link to="/register">
            <Button variant="primary" size="md">
              Start Free
            </Button>
          </Link>

          <Link to="/contact">
            <Button variant="outline" size="md">
              Contact Us
            </Button>
          </Link>
        </div>
      </div>

    </div>
  </section>

</div>


);
};

export default AboutUsPage;
