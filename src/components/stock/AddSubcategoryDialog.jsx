// AddSubcategoryDialog.js
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Select, MenuItem, FormControl, InputLabel, Snackbar, Alert
} from '@mui/material';
import { supabase } from '../../supabaseClient';

const AddSubcategoryDialog = ({ open, onClose, fetchSubcategories, categories }) => {
  const [subcategoryName, setSubcategoryName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleAddSubcategory = async () => {
    if (!subcategoryName.trim() || !selectedCategoryId) {
      showSnackbar('Subcategory name and category must be selected', 'error');
      return;
    }

    const { error } = await supabase.from('subcategories').insert({
      subcategory_name: subcategoryName.trim(),
      category_id: selectedCategoryId,
    });
    if (error) {
      console.error('Error adding subcategory:', error);
      showSnackbar('Error adding subcategory', 'error');
    } else {
      showSnackbar('Subcategory added successfully', 'success');
      setSubcategoryName('');
      setSelectedCategoryId('');
      fetchSubcategories(); // Refresh the list of subcategories
      onClose();
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <>
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>Add New Subcategory</DialogTitle>
        <DialogContent>
          <TextField
            label="Subcategory Name"
            value={subcategoryName}
            onChange={(e) => setSubcategoryName(e.target.value)}
            fullWidth
            margin="dense"
            variant="outlined"
          />
          <FormControl fullWidth margin="dense" variant="outlined">
            <InputLabel>Category</InputLabel>
            <Select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              label="Category"
            >
              {categories.map((category) => (
                <MenuItem key={category.category_id} value={category.category_id}>
                  {category.category_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary">Cancel</Button>
          <Button onClick={handleAddSubcategory} color="primary">Add</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AddSubcategoryDialog;
