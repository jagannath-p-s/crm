import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient'; 
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
  Snackbar,
  Alert,
  InputAdornment,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  FilterList as FilterListIcon,
  Inventory as InventoryIcon,
  Search as SearchIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { LocalizationProvider, DatePicker } from '@mui/lab';
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import { format, parse, isValid } from 'date-fns';
import BatchDialog from './BatchDialog';
import Papa from 'papaparse'; // for CSV parsing

const BatchComponent = () => {
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [filter, setFilter] = useState('');
  const [customExpiryDate, setCustomExpiryDate] = useState(null);
  const [productSearch, setProductSearch] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState(null);

  useEffect(() => {
    fetchBatches();
    fetchProducts();
  }, []);

  const fetchBatches = async () => {
    const { data, error } = await supabase.from('batches').select('*');
    if (error) {
      showSnackbar(`Error fetching batches: ${error.message}`, 'error');
    } else {
      setBatches(data);
    }
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*');
    if (error) {
      showSnackbar(`Error fetching products: ${error.message}`, 'error');
    } else {
      setProducts(data);
    }
  };

  const handleFilterMenuOpen = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setFilterAnchorEl(null);
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    handleFilterMenuClose();
  };

  const filterBatches = (batches) => {
    const now = new Date();
    const tenDaysFromNow = new Date();
    tenDaysFromNow.setDate(now.getDate() + 10);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
    let filteredBatches = batches.filter((batch) => {
      if (!batch.expiry_date) return filter === ''; // Only include items without expiry date when no filter is applied
      const expiryDate = new Date(batch.expiry_date);
      switch (filter) {
        case 'expiringInNext10Days':
          return expiryDate <= tenDaysFromNow && expiryDate >= now;
        case 'expiringThisMonth':
          return expiryDate <= endOfMonth && expiryDate >= now;
        case 'customExpiryDate':
          return customExpiryDate && expiryDate <= customExpiryDate && expiryDate >= now;
        default:
          return true;
      }
    }).filter((batch) => {
      if (productSearch) {
        const product = products.find((p) => p.barcode_number === batch.barcode_number);
  
        // Check if product exists before attempting to access its properties
        const batchCodeMatch = batch.batch_code?.toLowerCase().includes(productSearch.toLowerCase());
        const productNameMatch = product?.item_name?.toLowerCase().includes(productSearch.toLowerCase());
        const productAliasMatch = product?.item_alias?.toLowerCase().includes(productSearch.toLowerCase());
  
        return batchCodeMatch || productNameMatch || productAliasMatch;
      }
      return true;
    });
  
    // Sort batches to move those without expiry dates to the bottom
    filteredBatches = filteredBatches.sort((a, b) => {
      if (!a.expiry_date && !b.expiry_date) return 0;
      if (!a.expiry_date) return 1;
      if (!b.expiry_date) return -1;
      return new Date(a.expiry_date) - new Date(b.expiry_date);
    });
  
    return filteredBatches;
  };
  

  const handleOpenBatchDialog = () => {
    setBatchDialogOpen(true);
  };

  const handleCloseBatchDialog = () => {
    setBatchDialogOpen(false);
  };

  const handleSaveBatch = async (batchCode, batchesToAdd) => {
    if (!batchCode.trim()) {
      showSnackbar('Please enter a batch code', 'error');
      return;
    }

    const allValid = batchesToAdd.every(batch => {
      const expiryDateValid = !batch.hasExpiryDate || (batch.expiryDate && isValid(parse(batch.expiryDate, 'yyyy-MM-dd', new Date())));
      return batch.barcodeNumber && batch.currentStock !== '' && expiryDateValid;
    });

    if (!allValid) {
      showSnackbar('Please fill in all required fields for each product', 'error');
      return;
    }

    try {
      // Fetch the current stock for each product and update it
      const updatedStocks = await Promise.all(batchesToAdd.map(async batch => {
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('current_stock')
          .eq('barcode_number', batch.barcodeNumber)
          .single();

        if (productError) throw productError;

        const newStock = productData.current_stock + parseInt(batch.currentStock, 10);
        return { barcodeNumber: batch.barcodeNumber, newStock };
      }));

      // Insert the new batches
      const payloads = batchesToAdd.map(batch => {
        let expiryDate = null;
        if (batch.hasExpiryDate && batch.expiryDate) {
          const parsedDate = parse(batch.expiryDate, 'yyyy-MM-dd', new Date());
          expiryDate = isValid(parsedDate) ? format(parsedDate, 'yyyy-MM-dd') : null;
        }

        return {
          barcode_number: batch.barcodeNumber,
          batch_code: batchCode, 
          expiry_date: expiryDate,
          current_stock: parseInt(batch.currentStock, 10),
          store: batch.store,
          rack_number: batch.rack_number,
          box_number: batch.box_number
        };
      });

      const { error: batchError } = await supabase.from('batches').insert(payloads);
      if (batchError) throw batchError;

      // Update the stock in the products table using barcode_number
      await Promise.all(updatedStocks.map(async ({ barcodeNumber, newStock }) => {
        const { error: updateError } = await supabase
          .from('products')
          .update({ current_stock: newStock })
          .eq('barcode_number', barcodeNumber);
        if (updateError) throw updateError;
      }));

      showSnackbar('Batches saved successfully', 'success');
      fetchBatches(); 
      fetchProducts(); 
      handleCloseBatchDialog();
    } catch (error) {
      console.error('Error adding batches:', error.message);
      showSnackbar(`Error adding batches: ${error.message}`, 'error');
    }
  };

  const handleDeleteBatch = async () => {
    const { batch_id, barcode_number, current_stock } = batchToDelete;
    
    try {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('current_stock')
        .eq('barcode_number', barcode_number)
        .single();

      if (productError) throw productError;

      const newStock = productData.current_stock - current_stock;
      if (newStock < 0) throw new Error('Stock cannot be negative');

      // Delete the batch using batch_id
      const { error: batchError } = await supabase.from('batches').delete().eq('batch_id', batch_id);
      if (batchError) throw batchError;

      // Update the stock in the products table using barcode_number
      const { error: updateError } = await supabase
        .from('products')
        .update({ current_stock: newStock })
        .eq('barcode_number', barcode_number);
      if (updateError) throw updateError;

      showSnackbar('Batch deleted successfully', 'success');
      fetchBatches();
      fetchProducts();
    } catch (error) {
      console.error('Error deleting batch:', error.message);
      showSnackbar(`Error deleting batch: ${error.message}`, 'error');
    } finally {
      setDeleteDialogOpen(false);
      setBatchToDelete(null);
    }
  };

  const confirmDeleteBatch = (batch) => {
    setBatchToDelete(batch);
    setDeleteDialogOpen(true);
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

  const handleCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      showSnackbar('No file selected', 'error');
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const { data, errors } = results;
        if (errors.length > 0) {
          showSnackbar(`Error parsing CSV: ${errors[0].message}`, 'error');
          return;
        }

        try {
          const formattedData = data.map(row => ({
            barcode_number: row.barcode_number?.trim() || '',
            batch_code: row.batch_code,
            expiry_date: row.expiry_date ? format(parse(row.expiry_date, 'yyyy-MM-dd', new Date()), 'yyyy-MM-dd') : null,
            current_stock: parseInt(row.current_stock, 10),
            store: row.store || null,
            rack_number: row.rack_number || null,
            box_number: row.box_number || null,
          }));

          const { error: insertError } = await supabase.from('batches').insert(formattedData);
          if (insertError) throw insertError;

          showSnackbar('Batches uploaded successfully', 'success');
          fetchBatches();
        } catch (error) {
          console.error('Error uploading CSV:', error.message);
          showSnackbar(`Error uploading CSV: ${error.message}`, 'error');
        }
      }
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-4">
              <InventoryIcon className="text-blue-500" style={{ fontSize: '1.75rem' }} />
              <h1 className="text-xl font-semibold ml-2">Batches</h1>
            </div>
            <div className="flex items-center space-x-2">
              <TextField
                variant="outlined"
                placeholder="Search Product / Batch"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                size="small"
                sx={{ pl: 1, pr: 1, py: 1, borderRadius: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <Tooltip title="Filter">
                <IconButton onClick={handleFilterMenuOpen} style={{ backgroundColor: '#e3f2fd', color: '#1e88e5', borderRadius: '12px' }}>
                  <FilterListIcon style={{ fontSize: '1.75rem' }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Add">
                <IconButton onClick={handleOpenBatchDialog} style={{ backgroundColor: '#e3f2fd', color: '#1e88e5', borderRadius: '12px' }}>
                  <AddIcon style={{ fontSize: '1.75rem' }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Upload CSV">
                <IconButton component="label" style={{ backgroundColor: '#e3f2fd', color: '#1e88e5', borderRadius: '12px' }}>
                  <UploadIcon style={{ fontSize: '1.75rem' }} />
                  <input type="file" hidden accept=".csv" onChange={handleCSVUpload} />
                </IconButton>
              </Tooltip>
              <Menu anchorEl={filterAnchorEl} open={Boolean(filterAnchorEl)} onClose={handleFilterMenuClose}>
                <MenuItem onClick={() => handleFilterChange('')}>All</MenuItem>
                <MenuItem onClick={() => handleFilterChange('expiringInNext10Days')}>Expiring in Next 10 Days</MenuItem>
                <MenuItem onClick={() => handleFilterChange('expiringThisMonth')}>Expiring This Month</MenuItem>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <MenuItem>
                    <DatePicker
                      label="Custom Expiry Date"
                      value={customExpiryDate}
                      onChange={(newDate) => setCustomExpiryDate(newDate)}
                      renderInput={(params) => <TextField {...params} />}
                    />
                  </MenuItem>
                </LocalizationProvider>
              </Menu>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-grow p-4 space-x-4 overflow-x-auto">
        <TableContainer component={Paper} className="shadow-md sm:rounded-lg overflow-auto">
          <Table stickyHeader className="min-w-full">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>No.</TableCell> 
                <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>Batch Code</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>Expiry Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>Stock</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>Barcode</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filterBatches(batches).map((batch, index) => (
                <TableRow key={batch.batch_id} className="bg-white border-b">
                  <TableCell>{index + 1}</TableCell> 
                  <TableCell>{batch.batch_code}</TableCell>
                  <TableCell>{batch.expiry_date}</TableCell>
                  <TableCell>{batch.current_stock}</TableCell>
                  <TableCell>{products.find((product) => product.barcode_number === batch.barcode_number)?.item_name}</TableCell>
                  <TableCell>{products.find((product) => product.barcode_number === batch.barcode_number)?.barcode_number}</TableCell>
                  <TableCell>
                    <Tooltip title="Delete">
                      <IconButton onClick={() => confirmDeleteBatch(batch)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      <BatchDialog
        open={batchDialogOpen}
        onClose={handleCloseBatchDialog}
        onSave={handleSaveBatch}
        products={products}
      />

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Confirm Delete"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this batch? This action will also reduce the product stock accordingly.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteBatch} autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default BatchComponent;
