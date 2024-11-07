import React, { useState, useEffect } from 'react';
import {
  Box, IconButton, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Snackbar, Alert, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Checkbox, FormControlLabel, Button, TablePagination
} from '@mui/material';
import {
  Edit as EditIcon, Delete as DeleteIcon, SettingsOutlined as SettingsOutlinedIcon, Download as DownloadIcon
} from '@mui/icons-material';
import { supabase } from '../../supabaseClient';
import { styled } from '@mui/material/styles';
import EditEnquiryDialog from './EditEnquiryDialog';
import Papa from 'papaparse';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  color: theme.palette.common.black,
  padding: theme.spacing(2),
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:first-of-type td, &:first-of-type th': {
    paddingLeft: theme.spacing(3),
  },
  '&:last-child td, &:last-child th': {
    paddingRight: theme.spacing(3),
  },
}));

const TableView = ({ visibleFields }) => {
  const [enquiries, setEnquiries] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEnquiry, setEditingEnquiry] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [productSearchTerm, setProductSearchTerm] = useState('');

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchEnquiries();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, productSearchTerm]);

  const fetchEnquiries = async () => {
    const { data, error } = await supabase.from('enquiries').select('*');
    if (error) {
      console.error('Error fetching enquiries:', error);
    } else {
      setEnquiries(data);
    }
  };

  const fetchProducts = async () => {
    try {
      let query = supabase.from('products').select('*', { count: 'exact' });

      if (productSearchTerm) {
        query = query.or(`product_name.ilike.%${productSearchTerm}%,item_alias.ilike.%${productSearchTerm}%`);
      }

      const { data, error } = await query
        .range(page * rowsPerPage, page * rowsPerPage + rowsPerPage - 1)
        .order('product_name');

      if (error) throw error;
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error.message);
    }
  };

  const handleEditEnquiry = (enquiry) => {
    setEditingEnquiry(enquiry);
    setDialogOpen(true);
    setSelectedProducts(parseProducts(enquiry.products));
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingEnquiry(null);
  };

  const handleFormSubmit = async (updatedEnquiry) => {
    try {
      const { error } = await supabase
        .from('enquiries')
        .update(updatedEnquiry)
        .eq('id', updatedEnquiry.id);
      if (error) throw error;
      fetchEnquiries();
      showSnackbar('Enquiry updated successfully', 'success');
    } catch (error) {
      console.error('Error updating enquiry:', error);
      showSnackbar('Error updating enquiry', 'error');
    }
    handleDialogClose();
  };

  const handleDeleteEnquiry = async (id) => {
    if (window.confirm('Are you sure you want to delete this enquiry?')) {
      try {
        const { error } = await supabase.from('enquiries').delete().eq('id', id);
        if (error) throw error;
        fetchEnquiries();
        showSnackbar('Enquiry deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting enquiry:', error);
        showSnackbar('Error deleting enquiry', 'error');
      }
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

  const parseProducts = (products) => {
    if (!products) return {};
    if (typeof products === 'string') {
      try {
        const cleanedProducts = products
          .replace(/""/g, '"')
          .replace(/\\\\"/g, '"')
          .replace(/"({)/g, '$1')
          .replace(/(})"/g, '$1');
        return JSON.parse(cleanedProducts);
      } catch (error) {
        console.error('Error parsing products:', error);
        return {};
      }
    }
    return products; // If it's already an object, return as is
  };

  const downloadCSV = () => {
    const fields = Object.keys(visibleFields).filter((key) => visibleFields[key]);
    const csvData = enquiries.map((enquiry) => {
      const result = {};
      fields.forEach((field) => {
        result[field] = enquiry[field] || '';
      });
      return result;
    });

    const csv = Papa.unparse(csvData, { header: true });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'enquiries.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  return (
    <Box className="flex flex-col min-h-screen bg-gray-100">
      <Box className="flex-grow p-4">
        <Button
          variant="contained"
          color="primary"
          startIcon={<DownloadIcon />}
          onClick={downloadCSV}
          sx={{ mb: 2 }}
        >
          Download as CSV
        </Button>
        <TableContainer component={Paper} className="shadow-md rounded-lg overflow-hidden">
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {visibleFields.name && <StyledTableCell>Name</StyledTableCell>}
                {visibleFields.mobilenumber1 && <StyledTableCell>Mobile Number 1</StyledTableCell>}
                {visibleFields.mobilenumber2 && <StyledTableCell>Mobile Number 2</StyledTableCell>}
                {visibleFields.address && <StyledTableCell>Address</StyledTableCell>}
                {visibleFields.location && <StyledTableCell>Location</StyledTableCell>}
                {visibleFields.stage && <StyledTableCell>Stage</StyledTableCell>}
                {visibleFields.dbt_userid_password && <StyledTableCell>DBT User ID/Password</StyledTableCell>}
                {visibleFields.leadsource && <StyledTableCell>Lead Source</StyledTableCell>}
                {visibleFields.assignedto && <StyledTableCell>Assigned To</StyledTableCell>}
                {visibleFields.remarks && <StyledTableCell>Remarks</StyledTableCell>}
                {visibleFields.subsidy && <StyledTableCell>Subsidy</StyledTableCell>}
                {visibleFields.invoiced && <StyledTableCell>Invoiced</StyledTableCell>}
                {visibleFields.collected && <StyledTableCell>Collected</StyledTableCell>}
                {visibleFields.products && <StyledTableCell>Products</StyledTableCell>}
                {visibleFields.created_at && <StyledTableCell>Created At</StyledTableCell>}
                {visibleFields.salesflow_code && <StyledTableCell>Salesflow Code</StyledTableCell>}
                {visibleFields.last_updated && <StyledTableCell>Last Updated</StyledTableCell>}
                {visibleFields.dbt_c_o && <StyledTableCell>DBT C/O</StyledTableCell>}
                {visibleFields.contacttype && <StyledTableCell>Contact Type</StyledTableCell>}
                <StyledTableCell>Actions</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {enquiries.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((enquiry) => (
                <StyledTableRow key={enquiry.id}>
                  {visibleFields.name && <TableCell>{enquiry.name}</TableCell>}
                  {visibleFields.mobilenumber1 && <TableCell>{enquiry.mobilenumber1}</TableCell>}
                  {visibleFields.mobilenumber2 && <TableCell>{enquiry.mobilenumber2 || 'N/A'}</TableCell>}
                  {visibleFields.address && <TableCell>{enquiry.address || 'N/A'}</TableCell>}
                  {visibleFields.location && <TableCell>{enquiry.location || 'N/A'}</TableCell>}
                  {visibleFields.stage && <TableCell>{enquiry.stage || 'N/A'}</TableCell>}
                  {visibleFields.dbt_userid_password && <TableCell>{enquiry.dbt_userid_password || 'N/A'}</TableCell>}
                  {visibleFields.leadsource && <TableCell>{enquiry.leadsource || 'N/A'}</TableCell>}
                  {visibleFields.assignedto && <TableCell>{enquiry.assignedto || 'N/A'}</TableCell>}
                  {visibleFields.remarks && <TableCell>{enquiry.remarks || 'N/A'}</TableCell>}
                  {visibleFields.subsidy && <TableCell>{enquiry.subsidy ? 'Yes' : 'No'}</TableCell>}
                  {visibleFields.invoiced && <TableCell>{enquiry.invoiced ? 'Yes' : 'No'}</TableCell>}
                  {visibleFields.collected && <TableCell>{enquiry.collected ? 'Yes' : 'No'}</TableCell>}
                  {visibleFields.products && (
                    <TableCell>
                      {Object.values(parseProducts(enquiry.products)).map((product, index) => (
                        <Typography key={index} variant="body2">
                          {product.product_name} ({product.quantity})
                        </Typography>
                      ))}
                    </TableCell>
                  )}
                  {visibleFields.created_at && <TableCell>{new Date(enquiry.created_at).toLocaleString()}</TableCell>}
                  {visibleFields.salesflow_code && <TableCell>{enquiry.salesflow_code || 'N/A'}</TableCell>}
                  {visibleFields.last_updated && <TableCell>{new Date(enquiry.last_updated).toLocaleString()}</TableCell>}
                  {visibleFields.dbt_c_o && <TableCell>{enquiry.dbt_c_o || 'N/A'}</TableCell>}
                  {visibleFields.contacttype && <TableCell>{enquiry.contacttype || 'N/A'}</TableCell>}
                  <TableCell>
                    <IconButton onClick={() => handleEditEnquiry(enquiry)} color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteEnquiry(enquiry.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={enquiries.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </Box>

      {editingEnquiry && (
        <EditEnquiryDialog
          dialogOpen={dialogOpen}
          enquiryData={editingEnquiry}
          handleDialogClose={handleDialogClose}
          handleFormSubmit={handleFormSubmit}
          users={[]} // Replace with actual users data if available
          products={products} // Pass fetched products
          selectedProducts={selectedProducts}
          handleProductToggle={(product) => {
            setSelectedProducts((prev) => {
              const newSelected = { ...prev };
              if (newSelected[product.product_id]) {
                delete newSelected[product.product_id];
              } else {
                newSelected[product.product_id] = { ...product, quantity: 1 };
              }
              return newSelected;
            });
          }}
          handleQuantityChange={(productId, change) => {
            setSelectedProducts((prev) => ({
              ...prev,
              [productId]: {
                ...prev[productId],
                quantity: Math.max(1, prev[productId].quantity + change),
              },
            }));
          }}
          productSearchTerm={productSearchTerm}
          handleProductSearchChange={(e) => setProductSearchTerm(e.target.value)}
          page={page}
          handlePageChange={(event, value) => setPage(value)}
          totalEstimate={Object.values(selectedProducts).reduce((sum, product) => sum + product.price * product.quantity, 0)}
          ITEMS_PER_PAGE={ITEMS_PER_PAGE}
          totalProducts={totalProducts}
          currentUserId={null} // Replace with actual current user ID if available
        />
      )}

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

      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)}>
        <DialogTitle>Customize Contact Card Fields</DialogTitle>
        <DialogContent>
          <DialogContentText>Select which fields to display in the contact card and table.</DialogContentText>
          {Object.keys(visibleFields).map((field) => (
            <FormControlLabel
              key={field}
              control={
                <Checkbox
                  checked={visibleFields[field]}
                  onChange={(e) => setVisibleFields({ ...visibleFields, [field]: e.target.checked })}
                  name={field}
                />
              }
              label={field.charAt(0).toUpperCase() + field.slice(1)}
            />
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TableView;
