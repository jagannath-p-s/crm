// AddCategoryDialog.js
import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Snackbar, Alert } from '@mui/material';
import { supabase } from '../../supabaseClient';

const AddCategoryDialog = ({ open, onClose, fetchCategories }) => {
  const [categoryName, setCategoryName] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleAddCategory = async () => {
    if (!categoryName.trim()) {
      showSnackbar('Category name cannot be empty', 'error');
      return;
    }

    const { error } = await supabase.from('categories').insert({ category_name: categoryName.trim() });
    if (error) {
      console.error('Error adding category:', error);
      showSnackbar('Error adding category', 'error');
    } else {
      showSnackbar('Category added successfully', 'success');
      setCategoryName('');
      fetchCategories(); // Refresh the list of categories
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
        <DialogTitle>Add New Category</DialogTitle>
        <DialogContent>
          <TextField
            label="Category Name"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            fullWidth
            margin="dense"
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary">Cancel</Button>
          <Button onClick={handleAddCategory} color="primary">Add</Button>
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

export default AddCategoryDialog;
