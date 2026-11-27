import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import ProductModal from '../../Components/products/ProductModal';
import productService from '../../services/productService';
import { useToast } from '../../context/ToastContext';
import SEO from '../../Components/common/SEO';

const ProductCreatePage = () => {
  const navigate = useNavigate();

  const { success, error } = useToast();

  const [saving, setSaving] = useState(false);
  const submittingRef = useRef(false);

  // --------------------------------------------------
  // CREATE OR UPDATE PRODUCT
  // --------------------------------------------------

  const handleSaveProduct = useCallback(
    async (payload, productId = null) => {
      if (submittingRef.current) return;

      submittingRef.current = true;
      setSaving(true);

      try {
        let response;

        if (productId) {
          // Update existing product's final details.
          response = await productService.updateProduct(
            productId,
            payload
          );
        } else {
          // Create a new product.
          response = await productService.createProduct(payload);
        }

        // Handle unsuccessful API responses.
        if (response?.success === false) {
          throw new Error(
            response.message ||
              (productId
                ? 'Failed to update product.'
                : 'Failed to create product.')
          );
        }

        success(
          response?.message ||
            (productId
              ? 'Product updated successfully.'
              : 'Product created successfully.')
        );

        // Navigate back to the products page.
        navigate('/products', {
          replace: true,
          state: {
            productCreated: !productId,
            productUpdated: Boolean(productId),
          },
        });

      } catch (err) {
        console.error('Product save error:', err);

        error(
          err?.response?.data?.message ||
            err?.message ||
            'Something went wrong while saving the product.'
        );

      } finally {
        submittingRef.current = false;
        setSaving(false);
      }
    },
    [navigate, success, error]
  );

  // --------------------------------------------------
  // CANCEL
  // --------------------------------------------------

  const handleCancel = useCallback(() => {
    if (saving || submittingRef.current) return;

    navigate('/products');
  }, [navigate, saving]);

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div className="min-h-full">
      <SEO
        title="Add Product | Vyapix"
        description="Add a new product to your inventory catalog."
        path="/product/create"
        noIndex={true}
      />
      <ProductModal
        isOpen={true}
        onClose={handleCancel}
        onSave={handleSaveProduct}
        product={null}
        loading={saving}
      />
    </div>
  );
};

export default ProductCreatePage;