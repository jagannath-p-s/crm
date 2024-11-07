import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { supabase } from '../../supabaseClient';

const EditProductDialog = ({ open, onClose, product, fetchProducts, showSnackbar, categories, subcategories }) => {
  const [productData, setProductData] = useState(product || {});

  useEffect(() => {
    setProductData(product);
  }, [product]);

  const handleInputChange = (e) => {
    setProductData({ ...productData, [e.target.name]: e.target.value });
  };

  const handleEditProduct = async () => {
    try {
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('product_id', productData.product_id);
      if (error) throw error;
      showSnackbar('Product updated successfully', 'success');
      fetchProducts();
      onClose();
    } catch (error) {
      showSnackbar(error.message, 'error');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Product</DialogTitle>
      <DialogContent>
        <TextField
          label="Barcode Number"
          name="barcode_number"
          fullWidth
          margin="normal"
          value={productData?.barcode_number || ''}
          onChange={handleInputChange}
        />
        <TextField
          label="Item Name"
          name="item_name"
          fullWidth
          margin="normal"
          value={productData?.item_name || ''}
          onChange={handleInputChange}
        />
        <TextField
          label="Company Name"
          name="company_name"
          fullWidth
          margin="normal"
          value={productData?.company_name || ''}
          onChange={handleInputChange}
        />
        <TextField
          label="Price"
          name="price"
          fullWidth
          margin="normal"
          value={productData?.price || ''}
          onChange={handleInputChange}
        />
        <TextField
          label="Min Stock"
          name="min_stock"
          fullWidth
          margin="normal"
          value={productData?.min_stock || ''}
          onChange={handleInputChange}
        />
        <TextField
          label="Current Stock"
          name="current_stock"
          fullWidth
          margin="normal"
          value={productData?.current_stock || ''}
          onChange={handleInputChange}
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Category</InputLabel>
          <Select
            name="category_id"
            value={productData?.category_id || ''}
            onChange={handleInputChange}
          >
            {categories.map((category) => (
              <MenuItem key={category.category_id} value={category.category_id}>
                {category.category_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth margin="normal">
          <InputLabel>Subcategory</InputLabel>
          <Select
            name="subcategory_id"
            value={productData?.subcategory_id || ''}
            onChange={handleInputChange}
          >
            {subcategories.map((subcategory) => (
              <MenuItem key={subcategory.subcategory_id} value={subcategory.subcategory_id}>
                {subcategory.subcategory_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={handleEditProduct} color="primary">
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditProductDialog;
