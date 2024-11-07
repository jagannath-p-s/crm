import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { supabase } from './src/supabaseClient';
import AddEnquiryDialog from './AddEnquiryDialog';

const CommonFieldsCard = () => {
  const [commonFields, setCommonFields] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchCommonFields();
  }, []);

  const fetchCommonFields = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('common_fields')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;

      setCommonFields(data);
    } catch (error) {
      console.error('Error fetching common fields:', error);
      setError('Failed to fetch customer details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEnquiry = () => {
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleFormSubmit = async (enquiryData) => {
    try {
      const { data, error } = await supabase
        .from('enquiries')
        .insert([enquiryData]);

      if (error) throw error;

      setDialogOpen(false);
      setSnackbar({
        open: true,
        message: 'New enquiry added successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error adding new enquiry:', error);
      setSnackbar({
        open: true,
        message: 'Failed to add new enquiry. Please try again.',
        severity: 'error',
      });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" component="div">Common Customer Details</Typography>
        <Typography variant="body2">Name: {commonFields?.name}</Typography>
        <Typography variant="body2">Mobile 1: {commonFields?.mobilenumber1}</Typography>
        <Typography variant="body2">Mobile 2: {commonFields?.mobilenumber2}</Typography>
        <Typography variant="body2">Address: {commonFields?.address}</Typography>
        <Typography variant="body2">Location: {commonFields?.location}</Typography>
        <Box mt={2}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddEnquiry}
          >
            Add New Enquiry
          </Button>
        </Box>
      </CardContent>

      <AddEnquiryDialog
        dialogOpen={dialogOpen}
        handleDialogClose={handleDialogClose}
        handleFormSubmit={handleFormSubmit}
        enquiryData={commonFields}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default CommonFieldsCard;