import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Add as AddIcon } from '@mui/icons-material';
import { Menu, MenuItem, Box, Snackbar, Alert } from '@mui/material';
import { supabase } from '../../supabaseClient';
import AddEnquiryDialog from './AddEnquiryDialog';

const SearchBar = ({ onSearch, currentUserId }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState({});
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [totalEstimate, setTotalEstimate] = useState(0);
  const [users, setUsers] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [enquiryData, setEnquiryData] = useState({
    name: '',
    mobilenumber1: '',
    mobilenumber2: '',
    address: '',
    location: '',
    stage: 'Lead',
    dbt_userid_password: '',
    leadsource: '',
    assignedto: currentUserId,
    remarks: '',
    invoiced: false,
    collected: false,
    created_at: new Date().toISOString(),
    salesflow_code: '',
    won_date: null,
    expected_completion_date: '',
    state: '',
    district: '',
    contacttype: [],
    subsidy: false,
    dbt_c_o: '',
  });

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    if (dialogOpen && dialogType === 'product') {
      fetchProducts();
    }
  }, [dialogOpen, dialogType, page, productSearchTerm]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    calculateTotalEstimate();
  }, [selectedProducts]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from('users').select('id, username');
      if (error) throw error;
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error.message);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error, count } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .order('item_name', { ascending: true })
        .ilike('item_name', `%${productSearchTerm}%`)
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

      if (error) throw error;
      setProducts(data);
      setTotalProducts(count);
    } catch (error) {
      console.error('Error fetching products:', error.message);
      showSnackbar('Failed to fetch products', 'error');
    }
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    onSearch(e.target.value);
  };

  const handleProductSearchChange = (e) => setProductSearchTerm(e.target.value);

  const handleAddClick = (event) => setAnchorEl(event.currentTarget);

  const handleMenuClose = () => setAnchorEl(null);

  const handleDialogOpen = async (type) => {
    setDialogType(type);
    setDialogOpen(true);
    setAnchorEl(null);
    setSelectedProducts({});
    setPage(1);
    setProductSearchTerm('');

    if (searchTerm) {
      const { data, error } = await supabase
        .from('enquiries')
        .select('name, mobilenumber1, mobilenumber2, address, location')
        .eq('mobilenumber1', searchTerm)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching enquiry data:', error);
        showSnackbar('Failed to fetch enquiry data', 'error');
      } else if (data && data.length > 0) {
        setEnquiryData({ ...data[0], mobilenumber1: searchTerm });
      } else {
        resetEnquiryData();
      }
    }
  };

  const resetEnquiryData = () => {
    setEnquiryData({
      name: '',
      mobilenumber1: searchTerm,
      mobilenumber2: '',
      address: '',
      location: '',
      stage: 'Lead',
      dbt_userid_password: '',
      leadsource: '',
      assignedto: currentUserId,
      remarks: '',
      invoiced: false,
      collected: false,
      created_at: new Date().toISOString(),
      salesflow_code: '',
      won_date: null,
      expected_completion_date: '',
      state: '',
      district: '',
      contacttype: [],
      subsidy: false,
      dbt_c_o: '',
    });
  };

  const handleDialogClose = () => setDialogOpen(false);

  const handleProductToggle = (product) => {
    setSelectedProducts((prev) => {
      const newSelected = { ...prev };
      if (newSelected[product.product_id]) {
        delete newSelected[product.product_id];
      } else {
        newSelected[product.product_id] = { ...product, quantity: 1 };
      }
      return newSelected;
    });
  };

  const handleQuantityChange = (productId, change) => {
    setSelectedProducts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        quantity: Math.max(1, prev[productId].quantity + change),
      },
    }));
  };

  const calculateTotalEstimate = () => {
    const total = Object.values(selectedProducts).reduce((sum, product) => {
      return sum + (product.price || 0) * product.quantity;
    }, 0);
    setTotalEstimate(total);
  };

  const handleFormSubmit = async (formData) => {
    try {
      const formattedData = {
        ...formData,
        won_date: formData.won_date ? new Date(formData.won_date).toISOString() : null,
        expected_completion_date: formData.expected_completion_date ? new Date(formData.expected_completion_date).toISOString() : null,
        created_at: formData.created_at ? new Date(formData.created_at).toISOString() : new Date().toISOString(),
        products: JSON.stringify(selectedProducts),
      };

      const { error } = await supabase.from('enquiries').insert([formattedData]);

      if (error) throw error;
      showSnackbar('Enquiry added successfully!', 'success');
      handleDialogClose();
    } catch (error) {
      console.error('Error submitting form:', error.message);
      showSnackbar(`Failed to save the enquiry: ${error.message}`, 'error');
    }
  };

  const handlePageChange = (event, value) => setPage(value);

  const showSnackbar = (message, severity) => setSnackbar({ open: true, message, severity });

  const handleCloseSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

  return (
    <Box sx={{ width: '100%', maxWidth: 600, margin: 'auto' }}>
      <div className="flex items-center w-full max-w-md bg-white rounded-full border border-gray-300 shadow-sm">
        <div className="pl-4 pr-2 py-2">
          <SearchIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="flex-grow py-2 px-2 bg-transparent outline-none text-sm"
          placeholder="Search"
          value={searchTerm}
          onChange={handleInputChange}
        />
        {searchTerm && (
          <div className="pr-2 py-1.5">
            <button
              type="button"
              className="p-1 rounded-full bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2"
              onClick={handleAddClick}
            >
              <AddIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => handleDialogOpen('product')}>Add Product Enquiry</MenuItem>
      </Menu>

      <AddEnquiryDialog
        dialogOpen={dialogOpen}
        dialogType={dialogType}
        enquiryData={enquiryData}
        handleDialogClose={handleDialogClose}
        handleFormSubmit={handleFormSubmit}
        users={users}
        products={products}
        selectedProducts={selectedProducts}
        handleProductToggle={handleProductToggle}
        handleQuantityChange={handleQuantityChange}
        productSearchTerm={productSearchTerm}
        handleProductSearchChange={handleProductSearchChange}
        page={page}
        handlePageChange={handlePageChange}
        totalEstimate={totalEstimate}
        totalProducts={totalProducts}
        currentUserId={currentUserId}
      />

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
    </Box>
  );
};

export default SearchBar;
