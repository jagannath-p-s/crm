import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Snackbar,
  Alert,
} from '@mui/material';
import { supabase } from '../../supabaseClient';

const AddStockOptions = ({
  fetchProducts,
  productDialogOpen,
  setProductDialogOpen,
  selectedProduct,
  setSelectedProduct,
}) => {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [newProduct, setNewProduct] = useState({
    item_name: '',
    company_name: '',
    category_id: '',
    subcategory_id: '',
    price: '',
    min_stock: '',
    current_stock: '',
    item_alias: '',
    model_number: '',
    uom: '',
    barcode_number: '',
    image_link: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [previousImagePath, setPreviousImagePath] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      setNewProduct(selectedProduct);
      setImagePreview(selectedProduct.image_link || '');
      const filePath = selectedProduct.image_link?.split('/').pop(); // Get the filename of the image to use for deletion
      setPreviousImagePath(filePath);
    } else {
      resetForm();
    }
  }, [selectedProduct]);

  const fetchCategories = async () => {
    const { data, error } = await supabase.from('categories').select('*');
    if (error) {
      console.error('Error fetching categories:', error);
      showSnackbar('Error fetching categories', 'error');
    } else setCategories(data);
  };

  const fetchSubcategories = async () => {
    const { data, error } = await supabase.from('subcategories').select('*');
    if (error) {
      console.error('Error fetching subcategories:', error);
      showSnackbar('Error fetching subcategories', 'error');
    } else setSubcategories(data);
  };

  const resetForm = () => {
    setNewProduct({
      item_name: '',
      company_name: '',
      category_id: '',
      subcategory_id: '',
      price: '',
      min_stock: '',
      current_stock: '',
      item_alias: '',
      model_number: '',
      uom: '',
      barcode_number: '',
      image_link: '',
    });
    setImageFile(null);
    setImagePreview('');
    setPreviousImagePath('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePreviousImage = async (filePath) => {
    if (filePath) {
      const { error } = await supabase.storage.from('files').remove([`product_images/${filePath}`]);
      if (error) {
        console.error('Error removing previous image:', error);
      }
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;

    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `product_images/${fileName}`;

    const { data, error } = await supabase.storage.from('files').upload(filePath, imageFile);

    if (error) {
      console.error('Error uploading image:', error);
      showSnackbar('Error uploading image', 'error');
      return null;
    }

    const { data: publicUrlData, error: publicURLError } = supabase.storage
      .from('files')
      .getPublicUrl(filePath);

    if (publicURLError || !publicUrlData.publicUrl) {
      console.error('Error getting public URL:', publicURLError);
      showSnackbar('Error getting image URL', 'error');
      return null;
    }

    return publicUrlData.publicUrl;
  };

  const handleAddProduct = async () => {
    let imageUrl = newProduct.image_link;

    if (imageFile) {
      if (previousImagePath) {
        await removePreviousImage(previousImagePath); // Remove the old image
      }
      imageUrl = await uploadImage(); // Upload the new image
    }

    const productData = { ...newProduct, image_link: imageUrl };

    const { data, error } = await supabase.from('products').upsert([productData], { onConflict: 'product_id' });

    if (error) {
      console.error('Error adding/updating product:', error);
      showSnackbar('Error adding/updating product', 'error');
    } else {
      fetchProducts();
      setProductDialogOpen(false);
      resetForm();
      showSnackbar(selectedProduct ? 'Product updated successfully' : 'Product added successfully', 'success');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <>
      {/* Product Dialog */}
      <Dialog open={productDialogOpen} onClose={() => setProductDialogOpen(false)} className="rounded-lg shadow-xl">
        <DialogTitle className="text-lg font-semibold p-4">{selectedProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        <DialogContent className="p-6 space-y-4">
          <TextField
            label="Item Name"
            value={newProduct.item_name}
            onChange={(e) => setNewProduct({ ...newProduct, item_name: e.target.value })}
            fullWidth
            margin="dense"
            variant="outlined"
          />
          <TextField
            label="Company Name"
            value={newProduct.company_name}
            onChange={(e) => setNewProduct({ ...newProduct, company_name: e.target.value })}
            fullWidth
            margin="dense"
            variant="outlined"
          />
          <FormControl fullWidth margin="dense" variant="outlined">
            <InputLabel>Category</InputLabel>
            <Select
              value={newProduct.category_id}
              onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })}
              style={{ borderRadius: '8px', padding: '12px' }} // Improved dropdown style
            >
              {categories.map((category) => (
                <MenuItem key={category.category_id} value={category.category_id}>
                  {category.category_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense" variant="outlined">
            <InputLabel>Subcategory</InputLabel>
            <Select
              value={newProduct.subcategory_id}
              onChange={(e) => setNewProduct({ ...newProduct, subcategory_id: e.target.value })}
              style={{ borderRadius: '8px', padding: '12px' }} // Improved dropdown style
            >
              {subcategories
                .filter((sub) => sub.category_id === newProduct.category_id)
                .map((subcategory) => (
                  <MenuItem key={subcategory.subcategory_id} value={subcategory.subcategory_id}>
                    {subcategory.subcategory_name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <TextField
            label="Price"
            type="number"
            value={newProduct.price}
            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
            fullWidth
            margin="dense"
            variant="outlined"
          />
          <TextField
            label="Min Stock"
            type="number"
            value={newProduct.min_stock}
            onChange={(e) => setNewProduct({ ...newProduct, min_stock: e.target.value })}
            fullWidth
            margin="dense"
            variant="outlined"
          />
          <TextField
            label="Current Stock"
            type="number"
            value={newProduct.current_stock}
            onChange={(e) => setNewProduct({ ...newProduct, current_stock: e.target.value })}
            fullWidth
            margin="dense"
            variant="outlined"
          />

          {/* Dotted container for image preview */}
          <Box
            sx={{
              border: '2px dashed #ccc',
              borderRadius: '8px',
              p: 2,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '150px',
            }}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '150px' }} />
            ) : (
              <p style={{ color: '#aaa' }}>Image Preview</p>
            )}
          </Box>

          {/* Input for file upload */}
          <input
            accept="image/*"
            type="file"
            onChange={handleImageChange}
            style={{ display: 'none' }}
            id="image-upload"
          />
          <label htmlFor="image-upload">
            <Button variant="contained" component="span" fullWidth sx={{ mt: 2 }}>
              Choose Image
            </Button>
          </label>
        </DialogContent>
        <DialogActions className="p-4">
          <Button onClick={() => setProductDialogOpen(false)} className="text-gray-600 hover:text-gray-800">
            Cancel
          </Button>
          <Button onClick={handleAddProduct} className="bg-gray-200 text-gray-800 hover:bg-gray-300 rounded-md px-4 py-2 ml-4">
            {selectedProduct ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AddStockOptions;
