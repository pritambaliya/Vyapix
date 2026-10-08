import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import shopService from '../services/shopService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [shop, setShop] = useState(null);
  const [role, setRole] = useState(null); // 'owner' | 'billing' | null
  const [loading, setLoading] = useState(true);

  // Fetch shop details if owner
  const fetchShopDetails = useCallback(async () => {
    try {
      const response = await shopService.getShop();
      if (response.success && response.data?.shop) {
        setShop(response.data.shop);
      }
    } catch {
      setShop(null);
    }
  }, []);

  // Check existing session on load
  const checkAuth = useCallback(async () => {
    setLoading(true);
    try {
      // First check if owner session is valid
      const ownerRes = await authService.getOwnerProfile();
      if (ownerRes.success && ownerRes.data?.owner) {
        setUser(ownerRes.data.owner);
        setRole('owner');
        await fetchShopDetails();
        setLoading(false);
        return;
      }
    } catch {
      // Not an owner, now check if billing session is valid
      try {
        const billingRes = await authService.getBillingProfile();
        if (billingRes.success && billingRes.data?.billingAccount) {
          setUser(billingRes.data.billingAccount);
          setRole('billing');
          setShop(null);
          setLoading(false);
          return;
        }
      } catch {
        // No active session
      }
    }

    setUser(null);
    setShop(null);
    setRole(null);
    setLoading(false);
  }, [fetchShopDetails]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /**
   * Log in as Store Owner
   */
  const loginOwner = async (email, password) => {
    const res = await authService.loginOwner(email, password);
    if (res.success && res.data?.owner) {
      setUser(res.data.owner);
      setRole('owner');
      await fetchShopDetails();
    }
    return res;
  };

  /**
   * Log in as Billing Operator / Cashier
   */
  const loginBilling = async (billingCode, password) => {
    const res = await authService.loginBilling(billingCode, password);
    if (res.success && res.data?.billingAccount) {
      setUser(res.data.billingAccount);
      setRole('billing');
      setShop(null);
    }
    return res;
  };

  /**
   * Register a new Owner & Shop
   */
  const registerOwner = async (formData) => {
    const res = await authService.registerOwner(formData);
    if (res.success) {
      // Upon successful register, the backend sets the owner cookie
      await checkAuth();
    }
    return res;
  };

  /**
   * Log out current user
   */
  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setShop(null);
      setRole(null);
    }
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  const updateShopState = (updatedShop) => {
    setShop(updatedShop);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        shop,
        role,
        loading,
        isAuthenticated: Boolean(user),
        isOwner: role === 'owner',
        isBilling: role === 'billing',
        loginOwner,
        loginBilling,
        registerOwner,
        logout,
        refreshUser,
        updateShopState,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
