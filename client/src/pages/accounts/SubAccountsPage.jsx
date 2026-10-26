import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  KeyRound,
  Activity,
  CheckCircle2,
  XCircle,
  Key,
} from 'lucide-react';
import Button from '../../Components/common/Button';
import Badge from '../../Components/common/Badge';
import EmptyState from '../../Components/common/EmptyState';
import ConfirmModal from '../../Components/common/ConfirmModal';
import { TableSkeleton } from '../../Components/common/Skeleton';
import AccountModal from '../../Components/accounts/AccountModal';
import ResetPasswordModal from '../../Components/accounts/ResetPasswordModal';
import ActivityDrawer from '../../Components/accounts/ActivityDrawer';
import accountService from '../../services/accountService';
import { formatDateTime } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const SubAccountsPage = () => {
  const { isOwner } = useAuth();
  const { success, error } = useToast();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
 
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedAccountForReset, setSelectedAccountForReset] = useState(null);
  const [resetLoading, setResetLoading] = useState(false);

  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [selectedAccountIdForActivity, setSelectedAccountIdForActivity] = useState(null);

  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);
  const [accountToToggle, setAccountToToggle] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await accountService.getBillingAccounts();
      if (res.success && res.data) {
        setAccounts(res.data.billingAccounts || []);
      }
    } catch (err) {
      error(err.message || 'Failed to load sub-accounts');
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (payload) => {
    setCreateLoading(true);
    try {
      const res = await accountService.createBillingAccount(payload);
      if (res.success) {
        success(`Billing account ${res.data?.billingAccount?.accountNumber} created with code ${res.data?.billingAccount?.billingCode}`);
        setIsCreateModalOpen(false);
        fetchAccounts();
      }
    } catch (err) {
      error(err.message || 'Failed to create sub-account');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleConfirmToggleStatus = async () => {
    if (!accountToToggle) return;
    setStatusLoading(true);
    const newStatus = accountToToggle.status === 'active' ? 'disabled' : 'active';
    try {
      const res = await accountService.updateStatus(accountToToggle._id, newStatus);
      if (res.success) {
        success(`Account ${accountToToggle.accountNumber} is now ${newStatus}`);
        setStatusConfirmOpen(false);
        setAccountToToggle(null);
        fetchAccounts();
      }
    } catch (err) {
      error(err.message || 'Failed to update account status');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleResetPassword = async (payload) => {
    setResetLoading(true);
    try {
      const res = await accountService.resetPassword(payload.accountId, {
        ownerPassword: payload.ownerPassword,
        newPassword: payload.newPassword,
        confirmPassword: payload.confirmPassword,
      });
      if (res.success) {
        success('Cashier password reset successfully');
        setIsResetModalOpen(false);
        setSelectedAccountForReset(null);
      }
    } catch (err) {
      error(err.message || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="space-y-5 text-slate-800">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Cashier Sub-Accounts
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
            Provision cashier counters, manage operator billing codes, and track activity
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
          icon={Plus}
        >
          Add Sub-Account
        </Button>
      </div>

      {/* Info Card */}
      <div className="p-3 bg-orange-50/60 border border-slate-200 rounded-xl flex items-start gap-2.5">
        <KeyRound className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Cashiers log in using their assigned <strong>Billing Code</strong>. Sub-accounts cannot view confidential store cost prices or profit margins.
        </p>
      </div>

      {/* Accounts Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <TableSkeleton rows={4} cols={7} />
        ) : accounts.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No sub-accounts configured"
            message="Provision sub-billing accounts for cashier operators to start counter shifts."
            actionText="Create Sub-Account"
            onAction={() => setIsCreateModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                  <th className="px-4 py-3.5">Account #</th>
                  <th className="px-4 py-3.5">Billing Code</th>
                  <th className="px-4 py-3.5">Counter & Operator</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Last Active</th>
                  <th className="px-4 py-3.5">Total Bills</th>
                  <th className="py-2.5 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.map((acc) => {
                  const isActive = acc.status === 'active';

                  return (
                    <tr
                      key={acc._id}
                      className="hover:bg-orange-50/50 transition-colors"
                    >
                      <td className="whitespace-nowrap px-4 py-3.5 font-semibold text-slate-900">
                        {acc.accountNumber}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-100 text-slate-800 border border-slate-200">
                          {acc.billingCode}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">
                          {acc.name}
                        </div>
                        {acc.employeeName && (
                          <div className="mt-1 text-xs text-slate-500">
                            Assigned: {acc.employeeName}
                          </div>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5">
                        {isActive ? (
                          <Badge variant="success" dot size="xs">Active</Badge>
                        ) : (
                          <Badge variant="danger" dot size="xs">Disabled</Badge>
                        )}
                      </td>

                      <td className="py-2.5 px-3.5 text-slate-500 whitespace-nowrap text-xs">
                        {acc.lastLoginAt ? formatDateTime(acc.lastLoginAt) : 'Never logged in'}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 font-bold text-slate-900">
                        {acc.totalBills || 0}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAccountIdForActivity(acc._id);
                              setIsActivityOpen(true);
                            }}
                            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-emerald-50 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            title="View Audit Logs"
                          >
                            <Activity className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAccountForReset(acc);
                              setIsResetModalOpen(true);
                            }}
                            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-orange-50 hover:text-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            title="Reset Password"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setAccountToToggle(acc);
                              setStatusConfirmOpen(true);
                            }}
                            className={`rounded-lg p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                              isActive
                                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={isActive ? 'Disable Account' : 'Enable Account'}
                          >
                            {isActive ? (
                              <XCircle className="w-3.5 h-3.5" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals & Drawers */}
      <AccountModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateAccount={handleCreateAccount}
        loading={createLoading}
      />

      <ResetPasswordModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onResetPassword={handleResetPassword}
        account={selectedAccountForReset}
        loading={resetLoading}
      />

      <ActivityDrawer
        isOpen={isActivityOpen}
        onClose={() => setIsActivityOpen(false)}
        accountId={selectedAccountIdForActivity}
      />

      <ConfirmModal
        isOpen={statusConfirmOpen}
        onClose={() => setStatusConfirmOpen(false)}
        onConfirm={handleConfirmToggleStatus}
        title={accountToToggle?.status === 'active' ? 'Disable Account' : 'Enable Account'}
        message={`Are you sure you want to ${
          accountToToggle?.status === 'active' ? 'disable' : 'enable'
        } account "${accountToToggle?.name}" (${accountToToggle?.accountNumber})?`}
        confirmText={accountToToggle?.status === 'active' ? 'Disable' : 'Enable'}
        variant={accountToToggle?.status === 'active' ? 'danger' : 'warning'}
        loading={statusLoading}
      />
    </div>
  );
};

export default SubAccountsPage;
