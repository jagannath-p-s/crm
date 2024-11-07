import React, { useState, useEffect, useCallback } from 'react';
import {
  TextField,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Alert,
  FormControl,
  Box,
  Typography,
  TablePagination,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Settings as SettingsIcon,
  FilterList as FilterListIcon,
  Storage as StorageIcon,
  Download as DownloadIcon,
  Category as CategoryIcon,
  SubdirectoryArrowRight as SubcategoryIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Description as FileIcon,
} from '@mui/icons-material';
import { supabase } from '../../supabaseClient';
import DownloadDialog from './DownloadDialog';
import AddStockOptions from './AddStockOptions';
import AddCategoryDialog from './AddCategoryDialog';
import AddSubcategoryDialog from './AddSubcategoryDialog';
import ManageCategoriesDialog from './ManageCategoriesDialog';

const StockTable = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [subcategoryDialogOpen, setSubcategoryDialogOpen] = useState(false);
  const [manageCategoriesDialogOpen, setManageCategoriesDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);
  const [addAnchorEl, setAddAnchorEl] = useState(null);
  const [openDownloadDialog, setOpenDownloadDialog] = useState(false);
  

  const [visibleColumns, setVisibleColumns] = useState({
    slno: true,
    barcodeNumber: true,
    itemName: true,
    companyName: true,
    category: true,
    subcategory: true,
    price: true,
    minStock: true,
    currentStock: true,
    itemAlias: true,
    modelNumber: true,
    uom: true,
    imageLink: true,
  });
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [optionsAnchorEl, setOptionsAnchorEl] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);
  const [fileDialogOpen, setFileDialogOpen] = useState(false);
  const [selectedFileUrl, setSelectedFileUrl] = useState('');
  const [unsupportedFile, setUnsupportedFile] = useState(false);
  

  const fetchProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      setProducts(data);
    } catch (error) {
      setError(error.message);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('categories').select('*');
      if (error) throw error;
      setCategories(data);
    } catch (error) {
      setError(error.message);
    }
  }, []);

  const fetchSubcategories = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('subcategories').select('*');
      if (error) throw error;
      setSubcategories(data);
    } catch (error) {
      setError(error.message);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchSubcategories();
  }, [fetchProducts, fetchCategories, fetchSubcategories]);

  useEffect(() => {
    const filterProducts = () => {
      const results = products.filter((product) => {
        const searchTermLower = searchTerm.toLowerCase();
        return (
          product.item_name?.toLowerCase().includes(searchTermLower) ||
          product.company_name?.toLowerCase().includes(searchTermLower) ||
          categories.find((cat) => cat.category_id === product.category_id)?.category_name?.toLowerCase().includes(searchTermLower) ||
          subcategories.find((sub) => sub.subcategory_id === product.subcategory_id)?.subcategory_name?.toLowerCase().includes(searchTermLower) ||
          product.barcode_number?.toLowerCase().includes(searchTermLower) ||
          product.item_alias?.toLowerCase().includes(searchTermLower) ||
          product.model_number?.toLowerCase().includes(searchTermLower) ||
          product.uom?.toLowerCase().includes(searchTermLower)
        );
      });

      if (filter === 'lowStock') {
        setFilteredProducts(results.filter((product) => product.current_stock <= product.min_stock));
      } else {
        setFilteredProducts(results);
      }
    };

    filterProducts();
  }, [products, searchTerm, filter, categories, subcategories]);

  const handleFilterMenuOpen = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleSettingsMenuOpen = (event) => {
    setSettingsAnchorEl(event.currentTarget);
  };

  const handleAddMenuOpen = (event) => {
    setAddAnchorEl(event.currentTarget);
  };

  // Modified handleMenuClose to accept a parameter specifying which menu to close
  const handleMenuClose = (menu) => {
    if (menu === 'filter') {
      setFilterAnchorEl(null);
    } else if (menu === 'settings') {
      setSettingsAnchorEl(null);
    } else if (menu === 'add') {
      setAddAnchorEl(null);
    } else if (menu === 'options') {
      setOptionsAnchorEl(null);
    }
  };

  const handleOpenProductDialog = () => {
    setProductDialogOpen(true);
    handleMenuClose('add');
  };

  const handleOpenCategoryDialog = () => {
    setCategoryDialogOpen(true);
    handleMenuClose('add');
  };

  const handleOpenSubcategoryDialog = () => {
    setSubcategoryDialogOpen(true);
    handleMenuClose('add');
  };

  const handleOpenManageCategoriesDialog = () => {
    setManageCategoriesDialogOpen(true);
    handleMenuClose('add');
  };

  const handleCloseManageCategoriesDialog = () => {
    setManageCategoriesDialogOpen(false);
  };

  const handleDownloadDialogOpen = () => {
    setOpenDownloadDialog(true);
  };

  const handleDownloadDialogClose = () => {
    setOpenDownloadDialog(false);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getCurrentStockColor = (current, min) => {
    if (current <= min) return 'red';
    if (current > min) return 'green';
    return 'gray';
  };

  const handleOptionsMenuOpen = (event, product) => {
    setOptionsAnchorEl(event.currentTarget);
    setSelectedProduct(product);
  };

  const handleDeleteProduct = async () => {
    try {
      const { error } = await supabase.from('products').delete().eq('product_id', selectedProduct.product_id);
      if (error) throw error;
      showSnackbar('Product deleted successfully', 'success');
      fetchProducts();
    } catch (error) {
      setError(error.message);
      showSnackbar(error.message, 'error');
    }
    handleMenuClose('options');
  };

  const handleEditProduct = () => {
    setProductDialogOpen(true);
    handleMenuClose('options');
  };

  const handleFilterChange = (filterType) => {
    setFilter(filterType);
    handleMenuClose('filter');
  };

  const handleFilePreview = async (fileUrl) => {
    const fileType = fileUrl.split('.').pop().toLowerCase();
    setUnsupportedFile(false);

    if (fileType === 'pdf') {
      setUnsupportedFile(true);
      setSelectedFileUrl('');
    } else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileType)) {
      setSelectedFileUrl(fileUrl);
    } else {
      setUnsupportedFile(true);
      setSelectedFileUrl('');
    }

    setFileDialogOpen(true);
  };

  const getFileIcon = (filePath) => {
    const extension = filePath.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
      return <ImageIcon />;
    } else if (extension === 'pdf') {
      return <PdfIcon />;
    } else {
      return <FileIcon />;
    }
  };

  const handleCloseFileDialog = () => {
    setFileDialogOpen(false);
    setSelectedFileUrl('');
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-4">
              <StorageIcon className="text-blue-500" style={{ fontSize: '1.75rem' }} />
              <h1 className="text-xl font-semibold ml-2">Stock</h1>
            </div>
            <div className="flex items-center space-x-4">
              <TextField
                variant="outlined"
                placeholder="Search products..."
                value={searchTerm}
                onChange={handleSearchChange}
                size="small"
              />
              <Tooltip title="Download">
                <IconButton
                  onClick={handleDownloadDialogOpen}
                  style={{ backgroundColor: '#e3f2fd', color: '#1e88e5', borderRadius: '12px' }}
                >
                  <DownloadIcon style={{ fontSize: '1.75rem' }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Add">
                <IconButton onClick={handleAddMenuOpen} style={{ backgroundColor: '#e3f2fd', color: '#1e88e5', borderRadius: '12px' }}>
                  <AddIcon style={{ fontSize: '1.75rem' }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Filter">
                <IconButton onClick={handleFilterMenuOpen} style={{ backgroundColor: '#e3f2fd', color: '#1e88e5', borderRadius: '12px' }}>
                  <FilterListIcon style={{ fontSize: '1.75rem' }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Settings">
                <IconButton onClick={handleSettingsMenuOpen} style={{ backgroundColor: '#e3f2fd', color: '#1e88e5', borderRadius: '12px' }}>
                  <SettingsIcon style={{ fontSize: '1.75rem' }} />
                </IconButton>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-grow p-4 space-x-4 overflow-x-auto">
        <TableContainer component={Paper} className="shadow-md sm:rounded-lg overflow-auto">
          <Table stickyHeader className="min-w-full">
            <TableHead>
              <TableRow>
                {visibleColumns.slno && <TableCell align="center">SL No</TableCell>}
                {visibleColumns.barcodeNumber && <TableCell align="center">Barcode Number</TableCell>}
                {visibleColumns.itemName && <TableCell>Item Name</TableCell>}
                {visibleColumns.modelNumber && <TableCell>Model Number</TableCell>}
                {visibleColumns.companyName && <TableCell>Company Name</TableCell>}
                {visibleColumns.category && <TableCell>Category</TableCell>}
                {visibleColumns.subcategory && <TableCell>Subcategory</TableCell>}
                {visibleColumns.uom && <TableCell>UOM</TableCell>}
                {visibleColumns.price && <TableCell>Price (MRP)</TableCell>}
                {visibleColumns.minStock && <TableCell>Minimum Stock</TableCell>}
                {visibleColumns.currentStock && <TableCell>Stock</TableCell>}
                {visibleColumns.imageLink && <TableCell>Image</TableCell>}
                <TableCell>Options</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredProducts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((product, index) => (
                <TableRow key={product.product_id}>
                  {visibleColumns.slno && <TableCell align="center">{index + 1 + page * rowsPerPage}</TableCell>}
                  {visibleColumns.barcodeNumber && <TableCell align="center">{product.barcode_number}</TableCell>}
                  {visibleColumns.itemName && <TableCell>{product.item_name}</TableCell>}
                  {visibleColumns.modelNumber && <TableCell>{product.model_number}</TableCell>}
                  {visibleColumns.companyName && <TableCell>{product.company_name}</TableCell>}
                  {visibleColumns.category && (
                    <TableCell>{categories.find((cat) => cat.category_id === product.category_id)?.category_name}</TableCell>
                  )}
                  {visibleColumns.subcategory && (
                    <TableCell>{subcategories.find((sub) => sub.subcategory_id === product.subcategory_id)?.subcategory_name}</TableCell>
                  )}
                  {visibleColumns.uom && <TableCell>{product.uom}</TableCell>}
                  {visibleColumns.price && <TableCell>{product.price}</TableCell>}
                  {visibleColumns.minStock && <TableCell>{product.min_stock}</TableCell>}
                  {visibleColumns.currentStock && (
                    <TableCell style={{ color: getCurrentStockColor(product.current_stock, product.min_stock) }}>
                      {product.current_stock}
                    </TableCell>
                  )}
                  {visibleColumns.imageLink && (
                    <TableCell>
                      {product.image_link ? (
                        <Tooltip title="Preview file">
                          <IconButton onClick={() => handleFilePreview(product.image_link)}>
                            {getFileIcon(product.image_link)}
                          </IconButton>
                        </Tooltip>
                      ) : (
                        'No image'
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <Tooltip title="More options">
                      <IconButton onClick={(event) => handleOptionsMenuOpen(event, product)}>
                        <MoreVertIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredProducts.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
        <div className="flex justify-end mt-4">
          <Typography variant="body2" color="textSecondary">
            Total entries: {filteredProducts.length}
          </Typography>
        </div>
      </div>

      {/* Add Menu */}
      <AddCategoryDialog
  open={categoryDialogOpen}
  onClose={() => setCategoryDialogOpen(false)}
  fetchCategories={fetchCategories}
/>

<AddSubcategoryDialog
  open={subcategoryDialogOpen}
  onClose={() => setSubcategoryDialogOpen(false)}
  fetchSubcategories={fetchSubcategories}
  categories={categories}
/>
      <Menu anchorEl={addAnchorEl} open={Boolean(addAnchorEl)} onClose={() => handleMenuClose('add')}>
        <MenuItem onClick={handleOpenProductDialog}>
          <ListItemIcon>
            <AddIcon />
          </ListItemIcon>
          <ListItemText primary="Add Product" />
        </MenuItem>
        <MenuItem onClick={handleOpenCategoryDialog}>
          <ListItemIcon>
            <CategoryIcon />
          </ListItemIcon>
          <ListItemText primary="Add Category" />
        </MenuItem>
        <MenuItem onClick={handleOpenSubcategoryDialog}>
          <ListItemIcon>
            <SubcategoryIcon />
          </ListItemIcon>
          <ListItemText primary="Add Subcategory" />
        </MenuItem>
        <MenuItem onClick={handleOpenManageCategoriesDialog}>
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Manage Categories" />
        </MenuItem>
      </Menu>

      {/* Filter Menu */}
      <Menu anchorEl={filterAnchorEl} open={Boolean(filterAnchorEl)} onClose={() => handleMenuClose('filter')}>
        <MenuItem onClick={() => handleFilterChange('all')}>All</MenuItem>
        <MenuItem onClick={() => handleFilterChange('lowStock')}>Low Stock</MenuItem>
      </Menu>

      {/* Settings Menu */}
      <Menu anchorEl={settingsAnchorEl} open={Boolean(settingsAnchorEl)} onClose={() => handleMenuClose('settings')}>
        <Box sx={{ p: 2 }}>
          <FormControl component="fieldset" variant="standard">
            {Object.entries(visibleColumns).map(([key, value]) => (
              <MenuItem key={key}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={value}
                      onChange={(event) => setVisibleColumns({ ...visibleColumns, [key]: event.target.checked })}
                      name={key}
                    />
                  }
                  label={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim()}
                />
              </MenuItem>
            ))}
          </FormControl>
        </Box>
      </Menu>

      {/* Options Menu */}
      <Menu anchorEl={optionsAnchorEl} open={Boolean(optionsAnchorEl)} onClose={() => handleMenuClose('options')}>
        <MenuItem onClick={handleEditProduct}>
          <ListItemIcon>
            <EditIcon />
          </ListItemIcon>
          <ListItemText primary="Edit" />
        </MenuItem>
        <MenuItem onClick={handleDeleteProduct}>
          <ListItemIcon>
            <DeleteIcon />
          </ListItemIcon>
          <ListItemText primary="Delete" />
        </MenuItem>
      </Menu>

      <AddStockOptions
        fetchProducts={fetchProducts}
        productDialogOpen={productDialogOpen}
        setProductDialogOpen={setProductDialogOpen}
        categoryDialogOpen={categoryDialogOpen}
        setCategoryDialogOpen={setCategoryDialogOpen}
        subcategoryDialogOpen={subcategoryDialogOpen}
        setSubcategoryDialogOpen={setSubcategoryDialogOpen}
        selectedProduct={selectedProduct}
        setSelectedProduct={setSelectedProduct}
      />

      <ManageCategoriesDialog open={manageCategoriesDialogOpen} handleClose={handleCloseManageCategoriesDialog} />

      <DownloadDialog
        open={openDownloadDialog}
        handleClose={handleDownloadDialogClose}
        visibleColumns={visibleColumns}
        filteredProducts={filteredProducts}
        categories={categories}
        subcategories={subcategories}
      />

      {/* File Preview Dialog */}
      <Dialog open={fileDialogOpen} onClose={handleCloseFileDialog} maxWidth="sm" fullWidth>
        <DialogTitle>File Preview</DialogTitle>
        <DialogContent>
          {unsupportedFile ? (
            <Typography variant="body1">Unsupported file type for preview. Download it to view.</Typography>
          ) : selectedFileUrl ? (
            <img
              src={selectedFileUrl}
              alt="Preview"
              style={{ width: '100%', maxHeight: '600px', objectFit: 'contain' }}
            />
          ) : (
            <Typography variant="body1">Unsupported file type for preview. Download it to view.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFileDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notifications */}
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

      {error && (
        <Snackbar
          open={true}
          autoHideDuration={6000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      )}
    </div>
  );
};

export default StockTable;
