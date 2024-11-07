import React, { useState, useEffect } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, TextField, CircularProgress } from '@mui/material';
import { supabase } from '../../supabaseClient';

const EditStockOptions = ({ fetchProducts, productDialogOpen, setProductDialogOpen, selectedProduct }) => {
  const [formData, setFormData] = useState({
    barcode_number: '',
    item_alias: '',
    model_number: '',
    item_name: '',
    category_id: '',
    subcategory_id: '',
    price: '',
    min_stock: '',
    current_stock: '',
    company_name: '',
    uom: '',
    image_file: null,
  });

  useEffect(() => {
    if (selectedProduct) {
      setFormData({
        barcode_number: selectedProduct.barcode_number || '',
        item_alias: selectedProduct.item_alias || '',
        model_number: selectedProduct.model_number || '',
        item_name: selectedProduct.item_name || '',
        category_id: selectedProduct.category_id || '',
        subcategory_id: selectedProduct.subcategory_id || '',
        price: selectedProduct.price || '',
        min_stock: selectedProduct.min_stock || '',
        current_stock: selectedProduct.current_stock || '',
        company_name: selectedProduct.company_name || '',
        uom: selectedProduct.uom || '',
        image_file: null,
      });
    }
  }, [selectedProduct]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      image_file: e.target.files[0],
    }));
  };

  const handleSubmit = async () => {
    try {
      let imageUrl = selectedProduct.image_link;
      if (formData.image_file) {
        const fileExt = formData.image_file.name.split('.').pop();
        const fileName = `${formData.barcode_number || Date.now()}.${fileExt}`;
        const { data, error } = await supabase.storage
          .from('uploads')
          .upload(`public/${fileName}`, formData.image_file);

        if (error) throw error;
        const { publicURL } = supabase.storage
          .from('uploads')
          .getPublicUrl(`public/${fileName}`);
        imageUrl = publicURL;
      }

      const { error: updateError } = await supabase
        .from('products')
        .update({
          barcode_number: formData.barcode_number || null,
          item_alias: formData.item_alias || null,
          model_number: formData.model_number || null,
          item_name: formData.item_name,
          category_id: formData.category_id || null,
          subcategory_id: formData.subcategory_id || null,
          price: formData.price ? parseFloat(formData.price) : null,
          min_stock: formData.min_stock ? parseInt(formData.min_stock, 10) : null,
          current_stock: formData.current_stock ? parseInt(formData.current_stock, 10) : 0,
          company_name: formData.company_name || null,
          uom: formData.uom || null,
          image_link: imageUrl || null,
        })
        .eq('product_id', selectedProduct.product_id);

      if (updateError) throw updateError;

      setProductDialogOpen(false);
      fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  return (
    <Dialog open={productDialogOpen} onClose={() => setProductDialogOpen(false)} fullWidth maxWidth="md">
      <DialogTitle>Edit Product</DialogTitle>
      <DialogContent>
        <TextField name="barcode_number" label="Barcode Number" fullWidth value={formData.barcode_number} onChange={handleInputChange} />
        <TextField name="item_alias" label="Item Alias" fullWidth value={formData.item_alias} onChange={handleInputChange} />
        <TextField name="model_number" label="Model Number" fullWidth value={formData.model_number} onChange={handleInputChange} />
        <TextField name="item_name" label="Item Name" fullWidth required value={formData.item_name} onChange={handleInputChange} />
        <TextField name="category_id" label="Category ID" fullWidth value={formData.category_id} onChange={handleInputChange} />
        <TextField name="subcategory_id" label="Subcategory ID" fullWidth value={formData.subcategory_id} onChange={handleInputChange} />
        <TextField name="price" label="Price" fullWidth value={formData.price} onChange={handleInputChange} />
        <TextField name="min_stock" label="Minimum Stock" fullWidth value={formData.min_stock} onChange={handleInputChange} />
        <TextField name="current_stock" label="Current Stock" fullWidth value={formData.current_stock} onChange={handleInputChange} />
        <TextField name="company_name" label="Company Name" fullWidth value={formData.company_name} onChange={handleInputChange} />
        <TextField name="uom" label="Unit of Measurement (UOM)" fullWidth value={formData.uom} onChange={handleInputChange} />
        <input accept="image/*" type="file" onChange={handleFileChange} />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setProductDialogOpen(false)} color="secondary">Cancel</Button>
        <Button onClick={handleSubmit} color="primary">Update Product</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditStockOptions;
