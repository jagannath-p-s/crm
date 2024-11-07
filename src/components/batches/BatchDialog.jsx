import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  Grid,
  Autocomplete,
  Snackbar,
  Alert,
  IconButton,
  InputAdornment,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ClearIcon from '@mui/icons-material/Clear';

const BatchItem = ({ batch, index, productOptions, onBatchChange, onRemoveBatch }) => {
  return (
    <Box
      border="1px solid #e0e0e0"
      borderRadius={1}
      p={4}
      mb={4}
      sx={{ backgroundColor: index % 2 === 0 ? '#f5f5f5' : 'white' }}
    >
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Autocomplete
            options={productOptions}
            getOptionLabel={(option) => option.label}
            value={productOptions.find((option) => option.id === batch.productId) || null}
            onChange={(_, newValue) =>
              onBatchChange(index, 'productId', newValue ? newValue.id : '')
            }
            renderInput={(params) => <TextField {...params} label="Product" fullWidth />}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Number of Units"
            type="number"
            value={batch.currentStock}
            onChange={(e) => onBatchChange(index, 'currentStock', e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Checkbox
                checked={batch.hasExpiryDate}
                onChange={(e) => onBatchChange(index, 'hasExpiryDate', e.target.checked)}
              />
            }
            label="Has Expiry Date"
          />
        </Grid>
        {batch.hasExpiryDate && (
          <Grid item xs={12} md={6}>
            <TextField
              label="Expiry Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={batch.expiryDate}
              onChange={(e) => onBatchChange(index, 'expiryDate', e.target.value)}
              InputProps={{
                endAdornment: batch.expiryDate ? (
                  <InputAdornment position="end">
                    <IconButton onClick={() => onBatchChange(index, 'expiryDate', '')}>
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
              fullWidth
            />
          </Grid>
        )}
        <Grid item xs={12} md={6}>
          <TextField
            label="Store"
            value={batch.store}
            onChange={(e) => onBatchChange(index, 'store', e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Rack Number"
            value={batch.rack_number}
            onChange={(e) => onBatchChange(index, 'rack_number', e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Box Number"
            value={batch.box_number}
            onChange={(e) => onBatchChange(index, 'box_number', e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} style={{ textAlign: 'right' }}>
          <IconButton onClick={() => onRemoveBatch(index)} color="error">
            <DeleteIcon />
          </IconButton>
        </Grid>
      </Grid>
    </Box>
  );
};

const BatchDialog = ({ open, onClose, onSave, products }) => {
  const [batchCode, setBatchCode] = useState('');
  const [batches, setBatches] = useState([
    {
      productId: '',
      expiryDate: '',
      currentStock: '',
      hasExpiryDate: false,
      store: '',
      rack_number: '',
      box_number: '',
    },
  ]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    if (open) {
      setBatchCode('');
      setBatches([
        {
          productId: '',
          expiryDate: '',
          currentStock: '',
          hasExpiryDate: false,
          store: '',
          rack_number: '',
          box_number: '',
        },
      ]);
    }
  }, [open]);

  const productOptions = useMemo(
    () =>
      products.map((product) => ({
        id: product.product_id,
        label: `${product.item_name} (${product.item_alias || ''}) [${product.barcode_number || ''}]`,
        stock: product.current_stock,
        barcode: product.barcode_number,
        alias: product.item_alias,
      })),
    [products]
  );

  const isSaveDisabled = useMemo(() => {
    if (!batchCode.trim()) {
      return true;
    }
    return (
      batches.length === 0 ||
      batches.some((batch) => !batch.productId || batch.currentStock === '')
    );
  }, [batchCode, batches]);

  const handleAddBatch = () => {
    setBatches((prevBatches) => [
      ...prevBatches,
      {
        productId: '',
        expiryDate: '',
        currentStock: '',
        hasExpiryDate: false,
        store: '',
        rack_number: '',
        box_number: '',
      },
    ]);
  };

  const handleBatchChange = (index, field, value) => {
    const updatedBatches = [...batches];
    updatedBatches[index] = { ...updatedBatches[index], [field]: value };
    setBatches(updatedBatches);
  };

  const handleRemoveBatch = (index) => {
    const updatedBatches = batches.filter((_, i) => i !== index);
    setBatches(updatedBatches);
  };

  const handleSave = async () => {
    if (isSaveDisabled) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields for each product.',
        severity: 'error',
      });
      return;
    }

    try {
      await onSave(batchCode, batches);
      setSnackbar({ open: true, message: 'Batches saved successfully!', severity: 'success' });
      onClose();
    } catch (error) {
      console.error('Error saving batches:', error);
      setSnackbar({ open: true, message: 'Error saving batches.', severity: 'error' });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h5" component="div" align="center">
          Add New Batch
        </Typography>
      </DialogTitle>
      <DialogContent>
        {products.length === 0 ? (
          <Typography color="error" variant="h6">
            Please add at least one product before adding a batch.
          </Typography>
        ) : (
          <>
            <Box mb={6}>
              <TextField
                label="Batch Code"
                value={batchCode}
                onChange={(e) => setBatchCode(e.target.value)}
                helperText="Enter a unique code for this batch"
                fullWidth
              />
            </Box>
            {batches.map((batch, index) => (
              <BatchItem
                key={index}
                batch={batch}
                index={index}
                productOptions={productOptions}
                onBatchChange={handleBatchChange}
                onRemoveBatch={handleRemoveBatch}
              />
            ))}
            <Box display="flex" justifyContent="center" mt={6}>
              <Button
                startIcon={<AddCircleOutlineIcon />}
                onClick={handleAddBatch}
                variant="contained"
                color="primary"
              >
                Add Another Product
              </Button>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined" color="secondary">
          Cancel
        </Button>
        <Button onClick={handleSave} color="primary" variant="contained" disabled={isSaveDisabled}>
          Save All Batches
        </Button>
      </DialogActions>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default BatchDialog;
