import React, { useState, useEffect } from 'react';
import { Store, Upload, Trash2, Save, Building, Phone, MapPin, FileText, User, ShieldCheck } from 'lucide-react';

import Card from '../../Components/common/Card';
import Input from '../../Components/common/Input';
import Button from '../../Components/common/Button';
import Badge from '../../Components/common/Badge';
import shopService from '../../services/shopService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const ProfilePage = () => {
  const { user, shop, isOwner, updateShopState } = useAuth();
  const { success, error } = useToast();

  const [shopForm, setShopForm] = useState({
    shopName: '',
    phone: '',
    address: '',
    gstNumber: '',
  });

  const [savingShop, setSavingShop] = useState(false);
  const [logoLoading, setLogoLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    if (shop) {
      setShopForm({
        shopName: shop.shopName || '',
        phone: shop.phone || '',
        address: shop.address || '',
        gstNumber: shop.gstNumber || '',
      });

      setLogoPreview(shop.logo?.url || null);
    }
  }, [shop]);

  const handleShopChange = (e) => {
    const { name, value } = e.target;

    setShopForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveShop = async (e) => {
    e.preventDefault();
    setSavingShop(true);

    try {
      const res = await shopService.updateShop({
        shopName: shopForm.shopName.trim(),
        phone: shopForm.phone.trim(),
        address: shopForm.address.trim(),
        gstNumber: shopForm.gstNumber.trim().toUpperCase(),
      });

      if (res.success && res.data?.shop) {
        updateShopState(res.data.shop);
        success('Store details updated successfully');
      }
    } catch (err) {
      error(err.message || 'Failed to update store details');
    } finally {
      setSavingShop(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      error('Logo file size must be less than 2MB');
      e.target.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      error('Please select a valid image file');
      e.target.value = '';
      return;
    }

    setLogoLoading(true);

    try {
      const formData = new FormData();
      formData.append('logo', file);

      const res = await shopService.updateShopLogo(formData);

      if (res.success && res.data?.logo) {
        if (shop) {
          updateShopState({
            ...shop,
            logo: res.data.logo,
          });
        }

        setLogoPreview(res.data.logo.url);
        success('Store logo updated');
      }
    } catch {
      error('Failed to upload store logo');
    } finally {
      setLogoLoading(false);
      e.target.value = '';
    }
  };

  const handleDeleteLogo = async () => {
    setLogoLoading(true);

    try {
      const res = await shopService.deleteShopLogo();

      if (res.success) {
        if (shop) {
          updateShopState({
            ...shop,
            logo: null,
          });
        }

        setLogoPreview(null);
        success('Store logo removed');
      }
    } catch {
      error('Failed to remove logo');
    } finally {
      setLogoLoading(false);
    }
  };

  const sectionHeading =
    'text-sm font-bold text-slate-900';

  const sectionDescription =
    'mt-1 text-xs leading-relaxed text-slate-500';

  const detailCard =
    'rounded-xl border border-orange-100 bg-[#FFFEFC] p-4 transition-colors hover:border-orange-200';

  const detailLabel =
    'text-[10px] font-semibold uppercase tracking-wider text-slate-400';

  const detailValue =
    'mt-1 break-words text-sm font-semibold text-slate-800';

  return (
    <div className="mx-auto min-h-full max-w-4xl space-y-6 bg-[#FFFDF9] pb-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 border-b border-orange-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <Store size={19} />
            </div>

            <span className="text-xs font-semibold uppercase tracking-wider text-orange-600">
              Store Management
            </span>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Store Settings
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your business profile, store branding, and account details.
          </p>
        </div>

        <div className="flex w-fit items-center gap-2 rounded-lg border border-orange-100 bg-white px-3 py-2 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />

          <span className="text-xs font-medium text-slate-600">
            {isOwner ? 'Owner Access' : 'Cashier Access'}
          </span>
        </div>
      </div>

      {isOwner ? (
        <div className="space-y-5">
          {/* Business Information */}
          <Card
            title="Business Information"
            subtitle="Manage the details displayed on your store invoices."
            icon={Store}
          >
            <form onSubmit={handleSaveShop} className="space-y-5">
              <div className="rounded-xl border border-orange-100 bg-orange-50/50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-orange-600 shadow-sm">
                    <Building size={17} />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">
                      Your business identity
                    </h3>

                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      Keep your store details accurate for customer bills and
                      business records.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Store / Business Name"
                  name="shopName"
                  placeholder="e.g. Patel Supermarket"
                  icon={Store}
                  value={shopForm.shopName}
                  onChange={handleShopChange}
                  required
                />

                <Input
                  label="Store Phone Number"
                  name="phone"
                  placeholder="Enter business phone"
                  icon={Phone}
                  value={shopForm.phone}
                  onChange={handleShopChange}
                  required
                />
              </div>

              <Input
                label="Store Address"
                name="address"
                placeholder="Enter your complete business address"
                icon={MapPin}
                value={shopForm.address}
                onChange={handleShopChange}
                required
              />

              <div>
                <Input
                  label="GSTIN / GST Number"
                  name="gstNumber"
                  placeholder="e.g. 24AAAAA0000A1Z5"
                  icon={FileText}
                  value={shopForm.gstNumber}
                  onChange={handleShopChange}
                  helperText="Your GSTIN will be available for display on customer invoices."
                />
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-400">
                  Changes are saved to your store profile.
                </p>

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={savingShop}
                  icon={Save}
                >
                  Save Store Details
                </Button>
              </div>
            </form>
          </Card>

          {/* Store Logo */}
          <Card
            title="Store Branding"
            subtitle="Customize your business identity on printable invoices."
            icon={Building}
          >
            <div className="space-y-5">
              <div className="flex flex-col gap-5 rounded-xl border border-orange-100 bg-[#FFFEFC] p-4 sm:flex-row sm:items-center">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-orange-100 bg-orange-50">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Store logo preview"
                      className="h-full w-full object-contain p-2"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-orange-400">
                      <Store size={30} />
                      <span className="text-[9px] font-semibold uppercase tracking-wider">
                        No Logo
                      </span>
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Business Logo
                  </h3>

                  <p className={sectionDescription}>
                    Upload a recognizable logo to give your printed invoices
                    a professional appearance.
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <label
                      className={`inline-flex cursor-pointer items-center gap-2 rounded-lg bg-orange-500 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-orange-600 ${
                        logoLoading
                          ? 'pointer-events-none cursor-not-allowed opacity-60'
                          : ''
                      }`}
                    >
                      <Upload size={15} />

                      {logoLoading
                        ? 'Please wait...'
                        : logoPreview
                          ? 'Change Logo'
                          : 'Upload Logo'}

                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleLogoUpload}
                        disabled={logoLoading}
                        className="hidden"
                      />
                    </label>

                    {logoPreview && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleDeleteLogo}
                        loading={logoLoading}
                        icon={Trash2}
                        className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      >
                        Remove Logo
                      </Button>
                    )}
                  </div>

                  <p className="mt-3 text-[11px] text-slate-400">
                    PNG, JPG, or WEBP · Maximum file size: 2 MB
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Owner Account */}
          <Card
            title="Owner Account"
            subtitle="View the identity and role associated with your account."
            icon={ShieldCheck}
          >
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-orange-100 bg-orange-50/50 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm">
                <ShieldCheck size={19} />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-slate-800">
                  Administrator Account
                </h3>

                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Your owner account manages the store and its business
                  configuration.
                </p>
              </div>

              <Badge variant="success" size="xs">
                Owner
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className={detailCard}>
                <span className={detailLabel}>Owner Name</span>
                <p className={detailValue}>
                  {user?.name || 'Not available'}
                </p>
              </div>

              <div className={detailCard}>
                <span className={detailLabel}>Email Address</span>
                <p className={detailValue}>
                  {user?.email || 'Not available'}
                </p>
              </div>

              <div className={detailCard}>
                <span className={detailLabel}>Phone Number</span>
                <p className={detailValue}>
                  {user?.phone || 'Not provided'}
                </p>
              </div>

              <div className={detailCard}>
                <span className={detailLabel}>Account Role</span>
                <div className="mt-2">
                  <Badge variant="success" size="xs">
                    Store Owner (Admin)
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        /* Cashier Profile */
        <Card
          title="Cashier Account"
          subtitle="View your counter identity and assigned billing credentials."
          icon={User}
        >
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-orange-100 bg-orange-50/50 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm">
              <User size={19} />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                Cashier Profile
              </h3>

              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Your account information and assigned billing identification.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className={detailCard}>
              <span className={detailLabel}>Counter Name</span>
              <p className={detailValue}>
                {user?.name || 'Not available'}
              </p>
            </div>

            <div className={detailCard}>
              <span className={detailLabel}>Employee</span>
              <p className={detailValue}>
                {user?.employeeName || 'Assigned Staff'}
              </p>
            </div>

            <div className={detailCard}>
              <span className={detailLabel}>Billing Code</span>
              <p className="mt-1 break-words font-mono text-sm font-bold text-orange-600">
                {user?.billingCode || 'Not assigned'}
              </p>
            </div>

            <div className={detailCard}>
              <span className={detailLabel}>Account Number</span>
              <p className={detailValue}>
                {user?.accountNumber || 'Not available'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Footer */}
      <div className="flex items-center justify-center gap-2 py-2 text-center">
        <ShieldCheck size={14} className="text-orange-400" />

        <p className="text-[11px] text-slate-400">
          Your store information is managed securely through Vyapix.
        </p>
      </div>
    </div>
  );
};

export default ProfilePage;
