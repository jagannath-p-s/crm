import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Tooltip,
  Snackbar,
  Alert,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions as MuiDialogActions,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { supabase } from '../../supabaseClient';
import EditEnquiryDialog from '../contacts/EditEnquiryDialog';
import PipelineFormJSON from '../contacts/PipelineFormJSON';

const InfoCard = ({ data, type, onEdit }) => {
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [pipelineOpen, setPipelineOpen] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [selectedProducts, setSelectedProducts] = useState({});
  const [products, setProducts] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [assignedUser, setAssignedUser] = useState('');
  const [users, setUsers] = useState([]);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    if (type === 'enquiry') {
      fetchProducts();
      fetchAssignedUser();
      fetchUsers();
      initializeSelectedProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, productSearchTerm, page]);

  // Fetch Products with Pagination and Search
  const fetchProducts = async () => {
    try {
      const { data: productData, error, count } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .ilike('item_name', `%${productSearchTerm}%`)
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1)
        .order('item_name');

      if (error) throw error;
      setProducts(productData);
      setTotalProducts(count);
    } catch (error) {
      console.error('Error fetching products:', error.message);
      setSnackbar({
        open: true,
        message: 'Failed to fetch products.',
        severity: 'error',
      });
    }
  };

  // Fetch Assigned User Details
  const fetchAssignedUser = async () => {
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('username, employee_code')
        .eq('id', data.assignedto)
        .single();

      if (error) {
        console.error('Error fetching user data:', error.message);
        setAssignedUser('Unknown User');
        return;
      }

      setAssignedUser(`${userData.username} (${userData.employee_code})`);
    } catch (error) {
      console.error('Error fetching assigned user:', error.message);
      setAssignedUser('Unknown User');
    }
  };

  // Fetch Users for Dropdown in Edit Dialog
  const fetchUsers = async () => {
    try {
      const { data: usersData, error } = await supabase.from('users').select('*');
      if (error) throw error;
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error.message);
      setSnackbar({
        open: true,
        message: 'Failed to fetch users.',
        severity: 'error',
      });
    }
  };

  // Initialize Selected Products with Prices
  const initializeSelectedProducts = async () => {
    if (!data.products) return;

    const parsedProducts = parseProducts(data.products);
    const updatedSelectedProducts = {};

    for (const [productId, product] of Object.entries(parsedProducts)) {
      const { data: productData, error } = await supabase
        .from('products')
        .select('price')
        .eq('product_id', productId)
        .single();

      if (error) {
        console.error(`Error fetching price for product ID ${productId}:`, error.message);
        updatedSelectedProducts[productId] = {
          ...product,
          price: 0,
        };
      } else {
        updatedSelectedProducts[productId] = {
          ...product,
          price: parseFloat(productData.price) || 0,
        };
      }
    }
    setSelectedProducts(updatedSelectedProducts);
  };

  // Handle Expand/Collapse of Card
  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  // Handle Edit Button Click
  const handleEditClick = () => {
    setEditOpen(true);
  };

  // Handle Edit Dialog Close
  const handleEditClose = () => setEditOpen(false);

  // Handle Pipeline Button Click
  const handlePipelineClick = () => setPipelineOpen(true);
  const handlePipelineClose = () => setPipelineOpen(false);

  // Handle Save from Edit Dialog
  const handleSave = async (updatedEnquiry) => {
    try {
      const { error } = await supabase
        .from('enquiries')
        .update(updatedEnquiry)
        .eq('id', data.id);

      if (error) throw error;

      setEditOpen(false);
      onEdit(updatedEnquiry);
      setSnackbar({
        open: true,
        message: 'Enquiry updated successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error updating enquiry:', error);
      setError('Failed to update enquiry. Please try again later.');
      setSnackbar({
        open: true,
        message: 'Failed to update enquiry',
        severity: 'error',
      });
    }
  };

  // Parse Products from JSON/String
  const parseProducts = (products) => {
    if (!products) return {};
    if (typeof products === 'string') {
      try {
        return JSON.parse(products);
      } catch (error) {
        console.error('Error parsing products:', error);
        return {};
      }
    }
    return products;
  };

  // Calculate Total Estimate Based on Selected Products
  const calculateTotalEstimate = () => {
    return Object.values(selectedProducts).reduce((sum, product) => {
      return sum + (product.price || 0) * (product.quantity || 1);
    }, 0);
  };

  // Handle Product Selection Toggle
  const handleProductToggle = (product) => {
    setSelectedProducts((prev) => {
      const newSelected = { ...prev };
      if (newSelected[product.product_id]) {
        delete newSelected[product.product_id];
      } else {
        newSelected[product.product_id] = { ...product, quantity: 1, price: parseFloat(product.price) || 0 };
      }
      return newSelected;
    });
  };

  // Handle Quantity Change for a Product
  const handleQuantityChange = (productId, change) => {
    setSelectedProducts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        quantity: Math.max(1, prev[productId].quantity + change),
      },
    }));
  };

  // Render Card Content Based on Expansion
  const renderCardContent = () => {
    const productsData = parseProducts(data?.products);

    return (
      <>
        <Typography variant="h6" component="div">
          {data.name || data.customer_name}
        </Typography>
        <Typography variant="body2">
          Date: {new Date(data.created_at || data.date).toLocaleDateString()}
        </Typography>
        <Typography variant="body2">
          Contact: {data.mobilenumber1 || data.customer_mobile}
        </Typography>
        {expanded && (
          <>
            <Typography variant="body2">Address: {data.address}</Typography>
            <Typography variant="body2">Location: {data.location}</Typography>
            <Typography variant="body2">Stage: {data.stage}</Typography>
            <Typography variant="body2">DBT User ID/Password: {data.dbt_userid_password}</Typography>
            <Typography variant="body2">Lead Source: {data.leadsource}</Typography>
            <Typography variant="body2">Assigned To: {assignedUser}</Typography>
            <Typography variant="body2">Remarks: {data.remarks}</Typography>
            <Typography variant="body2">Subsidy: {data.subsidy ? 'Yes' : 'No'}</Typography>
            <Typography variant="body2">Invoiced: {data.invoiced ? 'Yes' : 'No'}</Typography>
            <Typography variant="body2">Collected: {data.collected ? 'Yes' : 'No'}</Typography>
            <Typography variant="body2">Salesflow Code: {data.salesflow_code}</Typography>
            {Object.values(productsData).length > 0 && (
              <Box mt={2}>
                <Typography variant="body2">Products:</Typography>
                {Object.values(productsData).map((product, index) => (
                  <Chip
                    key={index}
                    label={`${product.item_name} (${product.quantity})`}
                    size="small"
                    sx={{ mr: 1, mt: 1 }}
                  />
                ))}
              </Box>
            )}
          </>
        )}
      </>
    );
  };

  return (
    <Card sx={{ minHeight: '200px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {error && <Typography color="error">{error}</Typography>}
        {renderCardContent()}
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        {type === 'enquiry' && (
          <>
            <Tooltip title="Edit">
              <IconButton onClick={handleEditClick}>
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Pipeline">
              <IconButton onClick={handlePipelineClick}>
                <SettingsOutlinedIcon />
              </IconButton>
            </Tooltip>
          </>
        )}
        <Tooltip title={expanded ? 'Show Less' : 'Show More'}>
          <IconButton onClick={handleExpandClick}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Tooltip>
      </CardActions>

      {/* Edit Enquiry Dialog */}
      <EditEnquiryDialog
        dialogOpen={editOpen}
        enquiryData={data}
        handleDialogClose={handleEditClose}
        handleFormSubmit={handleSave}
        users={users} // Now passing the fetched users
        products={products}
        selectedProducts={selectedProducts}
        setSelectedProducts={setSelectedProducts}
        handleProductToggle={handleProductToggle} // Added handler
        handleQuantityChange={handleQuantityChange} // Added handler
        productSearchTerm={productSearchTerm}
        handleProductSearchChange={(e) => setProductSearchTerm(e.target.value)}
        page={page}
        handlePageChange={(event, value) => setPage(value)}
        totalEstimate={calculateTotalEstimate()}
        ITEMS_PER_PAGE={ITEMS_PER_PAGE}
        totalProducts={totalProducts}
        currentUserId={data.assignedto}
      />

      {/* Pipeline Dialog */}
      <Dialog open={pipelineOpen} onClose={handlePipelineClose} maxWidth="md" fullWidth>
        <DialogTitle>Pipeline Form</DialogTitle>
        <DialogContent>
          <PipelineFormJSON enquiryId={data.id} />
        </DialogContent>
        <MuiDialogActions>
          <Button onClick={handlePipelineClose} color="primary">
            Close
          </Button>
        </MuiDialogActions>
      </Dialog>

      {/* Snackbar for Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default InfoCard;
