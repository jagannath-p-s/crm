import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Grid, Snackbar, Alert, LinearProgress, Pagination
} from '@mui/material';
import { supabase } from '../../supabaseClient';
import InfoCard from './InfoCard';

const ITEMS_PER_PAGE = 12;

const SearchComponent = ({ searchTerm }) => {
  const [allEnquiries, setAllEnquiries] = useState([]);
  const [allServiceEnquiries, setAllServiceEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchAllData();
  }, [searchTerm]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch all enquiries
      const { data: enquiryData, error: enquiryError } = await supabase
        .from('enquiries')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,mobilenumber1.ilike.%${searchTerm}%,mobilenumber2.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (enquiryError) {
        throw new Error('Error fetching enquiries: ' + enquiryError.message);
      }

      // Fetch all service enquiries
      const { data: serviceEnquiryData, error: serviceEnquiryError } = await supabase
        .from('service_enquiries')
        .select('*')
        .or(`customer_name.ilike.%${searchTerm}%,customer_mobile.ilike.%${searchTerm}%,job_card_no.ilike.%${searchTerm}%`)
        .order('date', { ascending: false });

      if (serviceEnquiryError) {
        throw new Error('Error fetching service enquiries: ' + serviceEnquiryError.message);
      }

      setAllEnquiries(enquiryData);
      setAllServiceEnquiries(serviceEnquiryData);
    } catch (error) {
      console.error('Error fetching data:', error.message);
      setSnackbar({ open: true, message: error.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filteredEnquiries = useMemo(() => {
    if (!searchTerm) return allEnquiries;
    return allEnquiries.filter((enquiry) =>
      enquiry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.mobilenumber1.includes(searchTerm) ||
      enquiry.mobilenumber2?.includes(searchTerm)
    );
  }, [allEnquiries, searchTerm]);

  const filteredServiceEnquiries = useMemo(() => {
    if (!searchTerm) return allServiceEnquiries;
    return allServiceEnquiries.filter((serviceEnquiry) =>
      serviceEnquiry.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      serviceEnquiry.customer_mobile.includes(searchTerm) ||
      serviceEnquiry.job_card_no.includes(searchTerm)
    );
  }, [allServiceEnquiries, searchTerm]);

  const combinedResults = useMemo(() => {
    return [...filteredEnquiries, ...filteredServiceEnquiries].sort((a, b) => {
      const dateA = a.created_at || a.date;
      const dateB = b.created_at || b.date;
      return new Date(dateB) - new Date(dateA);
    });
  }, [filteredEnquiries, filteredServiceEnquiries]);

  const paginatedResults = useMemo(() => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return combinedResults.slice(startIndex, endIndex);
  }, [combinedResults, page]);

  const totalPages = Math.ceil(combinedResults.length / ITEMS_PER_PAGE);

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleEdit = (item) => {
    console.log("Edit item", item);
    // Implement your edit logic here
    fetchAllData(); // Refresh data after edit
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, margin: 'auto', padding: 2 }}>
      {loading ? (
        <LinearProgress />
      ) : (
        <>
          <Grid container spacing={3}>
            {paginatedResults.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <InfoCard 
                  data={item} 
                  type={item.customer_name ? "serviceEnquiry" : "enquiry"} 
                  onEdit={handleEdit}
                />
              </Grid>
            ))}
          </Grid>
          
          {combinedResults.length > 0 ? (
            <Box mt={4} display="flex" justifyContent="center">
              <Pagination 
                count={totalPages} 
                page={page} 
                onChange={handlePageChange} 
                color="primary" 
              />
            </Box>
          ) : (
            <Typography variant="body1" sx={{ mt: 4, textAlign: 'center' }}>
              No results found.
            </Typography>
          )}
        </>
      )}

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
    </Box>
  );
};

export default SearchComponent;