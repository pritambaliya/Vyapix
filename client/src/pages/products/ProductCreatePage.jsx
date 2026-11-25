import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import ProductModal from '../../Components/products/ProductModal';
import productService from '../../services/productService';
import { useToast } from '../../context/ToastContext';

const ProductCreatePage = () => {
  const navigate = useNavigate();

  const { success, error } = useToast();

  const [saving, setSaving] = useState(false);

  // Prevent duplicate API requests.
  const submittingRef = useRef(false);

  // --------------------------------------------------
  // CREATE PRODUCT
  // --------------------------------------------------

  const handleCreateProduct = useCallback(async (payload) => {
    if (submittingRef.current) return;

    submittingRef.current = true;
    setSaving(true);

    try {
      const response = await productService.createProduct(payload);

      if (response?.success === false) {
        throw new Error(
          response.message || 'Failed to create product'
        );
      }

      success(
        response?.message || 'Product added successfully'
      );

      // Return to product catalog after successful creation.
      navigate('/products', {
        replace: true,
        state: {
          productCreated: true,
        },
      });

    } catch (err) {
      error(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to create product'
      );
    } finally {
      submittingRef.current = false;
      setSaving(false);
    }
  }, [navigate, success, error]);

  // --------------------------------------------------
  // CANCEL CREATION
  // --------------------------------------------------

  const handleCancel = () => {
    if (saving) return;

    navigate('/products');
  };

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div className="min-h-full">

      <ProductModal
        isOpen={true}
        onClose={handleCancel}
        onSave={handleCreateProduct}
        product={null}
        loading={saving}
      />

    </div>
  );
};

export default ProductCreatePage;