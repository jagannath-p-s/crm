import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Snackbar,
  Alert,
  Typography,
  Box,
  Collapse,
  Tooltip,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, ExpandLess, ExpandMore } from '@mui/icons-material';
import { supabase } from '../../supabaseClient';

function ManageCategoriesDialog({ open, handleClose }) {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [categoryName, setCategoryName] = useState('');
  const [subcategoryName, setSubcategoryName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [expandedCategories, setExpandedCategories] = useState({});
  const [editDialog, setEditDialog] = useState({ open: false, type: '', id: null });
  const [confirmationDialog, setConfirmationDialog] = useState({ open: false, type: '', id: null, name: '' });

  const fetchData = useCallback(async (table) => {
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      setSnackbar({ open: true, message: `Failed to fetch ${table}`, severity: 'error' });
      return [];
    }
    return data;
  }, []);

  useEffect(() => {
    if (open) {
      fetchData('categories').then(setCategories);
      fetchData('subcategories').then(setSubcategories);
    }
  }, [open, fetchData]);

  const handleEditCategory = (category) => {
    setCategoryName(category.category_name);
    setSelectedCategory(category);
    setEditDialog({ open: true, type: 'category', id: category.category_id });
  };

  const handleEditSubcategory = (subcategory) => {
    setSubcategoryName(subcategory.subcategory_name);
    setSelectedSubcategory(subcategory);
    setEditDialog({ open: true, type: 'subcategory', id: subcategory.subcategory_id });
  };

  const handleUpdateCategory = async () => {
    if (selectedCategory) {
      const { error } = await supabase
        .from('categories')
        .update({ category_name: categoryName })
        .eq('category_id', selectedCategory.category_id);
      if (error) {
        setSnackbar({ open: true, message: 'Failed to update category', severity: 'error' });
      } else {
        setSnackbar({ open: true, message: 'Category updated successfully', severity: 'success' });
        resetForm();
        fetchData('categories').then(setCategories);
        setEditDialog({ open: false, type: '', id: null });
      }
    }
  };

  const handleUpdateSubcategory = async () => {
    if (selectedSubcategory) {
      const { error } = await supabase
        .from('subcategories')
        .update({ subcategory_name: subcategoryName, category_id: selectedSubcategory.category_id })
        .eq('subcategory_id', selectedSubcategory.subcategory_id);
      if (error) {
        setSnackbar({ open: true, message: 'Failed to update subcategory', severity: 'error' });
      } else {
        setSnackbar({ open: true, message: 'Subcategory updated successfully', severity: 'success' });
        resetForm();
        fetchData('subcategories').then(setSubcategories);
        setEditDialog({ open: false, type: '', id: null });
      }
    }
  };

  const handleDeleteCategory = (categoryId, categoryName) => {
    setConfirmationDialog({ open: true, type: 'category', id: categoryId, name: categoryName });
  };

  const handleDeleteSubcategory = (subcategoryId, subcategoryName) => {
    setConfirmationDialog({ open: true, type: 'subcategory', id: subcategoryId, name: subcategoryName });
  };

  const confirmDelete = async () => {
    const { type, id } = confirmationDialog;
    if (type === 'category') {
      const { data: productsInCategory, error: fetchError } = await supabase
        .from('products')
        .select('product_id')
        .eq('category_id', id);

      if (fetchError) {
        setSnackbar({ open: true, message: 'Failed to check products in category', severity: 'error' });
        return;
      }

      if (productsInCategory.length > 0) {
        setSnackbar({ open: true, message: 'Cannot delete category. Please remove all products in this category first.', severity: 'warning' });
        return;
      }

      const { error } = await supabase.from('categories').delete().eq('category_id', id);
      if (error) {
        setSnackbar({ open: true, message: 'Failed to delete category', severity: 'error' });
      } else {
        setSnackbar({ open: true, message: 'Category deleted successfully', severity: 'success' });
        fetchData('categories').then(setCategories);
      }
    } else if (type === 'subcategory') {
      const { data: productsInSubcategory, error: fetchError } = await supabase
        .from('products')
        .select('product_id')
        .eq('subcategory_id', id);

      if (fetchError) {
        setSnackbar({ open: true, message: 'Failed to check products in subcategory', severity: 'error' });
        return;
      }

      if (productsInSubcategory.length > 0) {
        setSnackbar({ open: true, message: 'Cannot delete subcategory. Please remove all products in this subcategory first.', severity: 'warning' });
        return;
      }

      const { error } = await supabase.from('subcategories').delete().eq('subcategory_id', id);
      if (error) {
        setSnackbar({ open: true, message: 'Failed to delete subcategory', severity: 'error' });
      } else {
        setSnackbar({ open: true, message: 'Subcategory deleted successfully', severity: 'success' });
        fetchData('subcategories').then(setSubcategories);
      }
    }

    setConfirmationDialog({ open: false, type: '', id: null, name: '' });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const resetForm = () => {
    setCategoryName('');
    setSubcategoryName('');
    setSelectedCategory(null);
    setSelectedSubcategory(null);
  };

  const toggleCategoryExpansion = (categoryId) => {
    setExpandedCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle>Manage Categories and Subcategories</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="row">
            <Box flex={1} mr={2}>
              <Typography variant="h6" gutterBottom>Categories</Typography>
              <List>
                {categories.map((category) => (
                  <React.Fragment key={category.category_id}>
                    <ListItem>
                      <ListItemText 
                        primary={
                          <Typography variant="subtitle1" style={{ fontWeight: 'bold' }}>
                            {category.category_name}
                          </Typography>
                        } 
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="Edit Category">
                          <IconButton edge="end" onClick={() => handleEditCategory(category)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Category">
                          <IconButton edge="end" onClick={() => handleDeleteCategory(category.category_id, category.category_name)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={expandedCategories[category.category_id] ? "Collapse" : "Expand"}>
                          <IconButton onClick={() => toggleCategoryExpansion(category.category_id)}>
                            {expandedCategories[category.category_id] ? <ExpandLess /> : <ExpandMore />}
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Collapse in={expandedCategories[category.category_id]} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding>
                        {subcategories
                          .filter((sub) => sub.category_id === category.category_id)
                          .map((sub) => (
                            <ListItem key={sub.subcategory_id} style={{ paddingLeft: '2em' }}>
                              <ListItemText primary={sub.subcategory_name} />
                              <ListItemSecondaryAction>
                                <Tooltip title="Edit Subcategory">
                                  <IconButton edge="end" onClick={() => handleEditSubcategory(sub)}>
                                    <EditIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete Subcategory">
                                  <IconButton edge="end" onClick={() => handleDeleteSubcategory(sub.subcategory_id, sub.subcategory_name)}>
                                    <DeleteIcon />
                                  </IconButton>
                                </Tooltip>
                              </ListItemSecondaryAction>
                            </ListItem>
                          ))}
                      </List>
                    </Collapse>
                  </React.Fragment>
                ))}
              </List>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, type: '', id: null })}>
        <DialogTitle>Edit {editDialog.type === 'category' ? 'Category' : 'Subcategory'}</DialogTitle>
        <DialogContent>
          <TextField
            label={editDialog.type === 'category' ? 'Category Name' : 'Subcategory Name'}
            value={editDialog.type === 'category' ? categoryName : subcategoryName}
            onChange={(e) => editDialog.type === 'category' ? setCategoryName(e.target.value) : setSubcategoryName(e.target.value)}
            fullWidth
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, type: '', id: null })}>Cancel</Button>
          <Button
            onClick={editDialog.type === 'category' ? handleUpdateCategory : handleUpdateSubcategory}
            variant="contained"
            color="primary"
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmationDialog.open} onClose={() => setConfirmationDialog({ open: false, type: '', id: null, name: '' })}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete the {confirmationDialog.type} "{confirmationDialog.name}"?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmationDialog({ open: false, type: '', id: null, name: '' })}>Cancel</Button>
          <Button onClick={confirmDelete} variant="contained" color="primary">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default ManageCategoriesDialog;
