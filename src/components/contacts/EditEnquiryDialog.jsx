// EditEnquiryDialog.jsx

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  IconButton,
  Typography,
  Pagination,
  Box,
  Chip,
} from '@mui/material';
import { supabase } from '../../supabaseClient';

const contactTypeOptions = ['Dairy', 'Agri', 'Irrigation', 'Others'];
const ITEMS_PER_PAGE = 10;

const EditEnquiryDialog = ({
  dialogOpen,
  enquiryData,
  handleDialogClose,
  handleFormSubmit,
  users,
  products,
  selectedProducts,
  setSelectedProducts,
  handleProductToggle,
  handleQuantityChange,
  productSearchTerm,
  handleProductSearchChange,
  page,
  handlePageChange,
  totalProducts,
  currentUserId,
}) => {
  const [leadSources, setLeadSources] = useState([]);
  const [localEnquiryData, setLocalEnquiryData] = useState(enquiryData);
  const [totalEstimate, setTotalEstimate] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false); // New state to track initialization

  useEffect(() => {
    const fetchLeadSources = async () => {
      const { data, error } = await supabase.from('lead_sources').select();
      if (error) {
        console.error('Error fetching lead sources:', error);
      } else {
        setLeadSources(data);
      }
    };
    fetchLeadSources();
  }, []);

  useEffect(() => {
    if (enquiryData) {
      const parsedContactType = enquiryData.contacttype
        ? typeof enquiryData.contacttype === 'string'
          ? enquiryData.contacttype.split(',')
          : enquiryData.contacttype
        : [];

      setLocalEnquiryData({
        ...enquiryData,
        contacttype: parsedContactType,
      });

      // Initialize selected products with prices
      initializeSelectedProducts(enquiryData.products);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enquiryData]);

  const initializeSelectedProducts = async (productsData) => {
    if (!productsData) return;

    const parsedProducts = parseProducts(productsData);
    const updatedSelectedProducts = { ...parsedProducts };

    const productIdsToFetch = Object.entries(parsedProducts)
      .filter(([_, product]) => !product.price)
      .map(([productId, _]) => productId);

    if (productIdsToFetch.length === 0) {
      setIsInitialized(true);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('product_id, price')
        .in('product_id', productIdsToFetch);

      if (error) {
        console.error('Error fetching product prices:', error);
      } else {
        data.forEach((product) => {
          if (updatedSelectedProducts[product.product_id]) {
            updatedSelectedProducts[product.product_id].price = parsePrice(product.price);
          }
        });
        setSelectedProducts(updatedSelectedProducts);
      }
    } catch (error) {
      console.error('Error during product price initialization:', error);
    } finally {
      setIsInitialized(true);
    }
  };

  const handleEnquiryDataChange = (e) => {
    const { name, value } = e.target;
    setLocalEnquiryData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLeadSourceChange = (e) => {
    const selectedLeadSource = e.target.value;
    const selectedSource = leadSources.find(
      (source) => source.lead_source === selectedLeadSource
    );

    setLocalEnquiryData((prev) => ({
      ...prev,
      leadsource: selectedLeadSource,
      state: selectedSource?.state || '',
      district: selectedSource?.district || '',
    }));
  };

  const handleContactTypeChange = (event) => {
    const { value } = event.target;
    setLocalEnquiryData((prev) => ({
      ...prev,
      contacttype: typeof value === 'string' ? value.split(',') : value,
    }));
  };

  const handleFormSubmission = () => {
    const formattedProducts = Object.entries(selectedProducts).reduce((acc, [key, product]) => {
      acc[key] = {
        product_id: product.product_id,
        barcode_number: product.barcode_number,
        item_name: product.item_name,
        quantity: product.quantity,
      };
      return acc;
    }, {});

    const updatedEnquiry = {
      ...localEnquiryData,
      products: JSON.stringify(formattedProducts),
      contacttype: Array.isArray(localEnquiryData.contacttype)
        ? localEnquiryData.contacttype.join(',')
        : localEnquiryData.contacttype,
    };

    handleFormSubmit(updatedEnquiry);
  };

  const parsePrice = (price) => {
    if (typeof price === 'string') {
      return parseFloat(price.replace(/[^\d.-]/g, '')) || 0;
    }
    return price || 0;
  };

  useEffect(() => {
    const calculateTotalEstimate = () => {
      const total = Object.values(selectedProducts).reduce((sum, product) => {
        const quantity = product.quantity || 0;
        const price = parsePrice(product.price);
        return sum + quantity * price;
      }, 0);
      setTotalEstimate(total);
    };

    calculateTotalEstimate();
  }, [selectedProducts]);

  // Removed the problematic useEffect that depended on selectedProducts

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

  return (
    <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Enquiry</DialogTitle>
      <DialogContent>
        <TextField
          name="name"
          label="Name"
          variant="outlined"
          fullWidth
          margin="dense"
          value={localEnquiryData?.name || ''}
          onChange={handleEnquiryDataChange}
          required
        />
        <TextField
          name="mobilenumber1"
          label="Mobile Number 1"
          variant="outlined"
          fullWidth
          margin="dense"
          value={localEnquiryData?.mobilenumber1 || ''}
          onChange={handleEnquiryDataChange}
          required
        />
        <TextField
          name="mobilenumber2"
          label="Mobile Number 2"
          variant="outlined"
          fullWidth
          margin="dense"
          value={localEnquiryData?.mobilenumber2 || ''}
          onChange={handleEnquiryDataChange}
        />
        <TextField
          name="address"
          label="Address"
          variant="outlined"
          fullWidth
          margin="dense"
          value={localEnquiryData?.address || ''}
          onChange={handleEnquiryDataChange}
        />
        <TextField
          name="location"
          label="Location"
          variant="outlined"
          fullWidth
          margin="dense"
          value={localEnquiryData?.location || ''}
          onChange={handleEnquiryDataChange}
        />
        <FormControl fullWidth margin="dense" required>
          <InputLabel>Stage</InputLabel>
          <Select
            name="stage"
            value={localEnquiryData?.stage || ''}
            onChange={handleEnquiryDataChange}
            label="Stage"
          >
            <MenuItem value="Lead">Lead</MenuItem>
            <MenuItem value="Prospect">Prospect</MenuItem>
            <MenuItem value="Opportunity">Opportunity</MenuItem>
            <MenuItem value="Customer Won">Customer Won</MenuItem>
            <MenuItem value="Customer Lost">Customer Lost</MenuItem>
          </Select>
        </FormControl>
        <TextField
          name="dbt_userid_password"
          label="DBT User ID/Password"
          variant="outlined"
          fullWidth
          margin="dense"
          value={localEnquiryData?.dbt_userid_password || ''}
          onChange={handleEnquiryDataChange}
        />
        <TextField
          name="dbt_c_o"
          label="DBT C/O"
          variant="outlined"
          fullWidth
          margin="dense"
          value={localEnquiryData?.dbt_c_o || ''}
          onChange={handleEnquiryDataChange}
        />
        <FormControl fullWidth margin="dense">
          <InputLabel>Lead Source</InputLabel>
          <Select
            name="leadsource"
            value={localEnquiryData?.leadsource || ''}
            onChange={handleLeadSourceChange}
            label="Lead Source"
          >
            {leadSources.map((source) => (
              <MenuItem key={source.id} value={source.lead_source}>
                {source.lead_source}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth margin="dense">
          <InputLabel>Assigned To</InputLabel>
          <Select
            name="assignedto"
            value={localEnquiryData?.assignedto || currentUserId}
            onChange={handleEnquiryDataChange}
            label="Assigned To"
          >
            {users.map((user) => (
              <MenuItem key={user.id} value={user.id}>
                {user.username} ({user.id})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          name="remarks"
          label="Remarks"
          variant="outlined"
          fullWidth
          margin="dense"
          multiline
          rows={2}
          value={localEnquiryData?.remarks || ''}
          onChange={handleEnquiryDataChange}
        />
        <FormControl fullWidth margin="dense">
          <InputLabel>Subsidy</InputLabel>
          <Select
            name="subsidy"
            value={localEnquiryData?.subsidy ? 'true' : 'false'}
            onChange={(e) =>
              handleEnquiryDataChange({
                target: { name: 'subsidy', value: e.target.value === 'true' },
              })
            }
            label="Subsidy"
          >
            <MenuItem value="true">Yes</MenuItem>
            <MenuItem value="false">No</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth margin="dense">
          <InputLabel>Invoiced</InputLabel>
          <Select
            name="invoiced"
            value={localEnquiryData?.invoiced ? 'true' : 'false'}
            onChange={(e) =>
              handleEnquiryDataChange({
                target: { name: 'invoiced', value: e.target.value === 'true' },
              })
            }
            label="Invoiced"
          >
            <MenuItem value="true">Yes</MenuItem>
            <MenuItem value="false">No</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth margin="dense">
          <InputLabel>Collected</InputLabel>
          <Select
            name="collected"
            value={localEnquiryData?.collected ? 'true' : 'false'}
            onChange={(e) =>
              handleEnquiryDataChange({
                target: { name: 'collected', value: e.target.value === 'true' },
              })
            }
            label="Collected"
          >
            <MenuItem value="true">Yes</MenuItem>
            <MenuItem value="false">No</MenuItem>
          </Select>
        </FormControl>
        <TextField
          name="expected_completion_date"
          label="Expected Completion Date"
          type="date"
          variant="outlined"
          fullWidth
          margin="dense"
          InputLabelProps={{ shrink: true }}
          value={localEnquiryData?.expected_completion_date?.split('T')[0] || ''}
          onChange={handleEnquiryDataChange}
        />
        <TextField
          name="salesflow_code"
          label="Salesflow Code"
          variant="outlined"
          fullWidth
          margin="dense"
          value={localEnquiryData?.salesflow_code || ''}
          onChange={handleEnquiryDataChange}
          InputProps={{
            readOnly: true,
          }}
        />
        <FormControl fullWidth margin="dense">
          <InputLabel>Contact Type</InputLabel>
          <Select
            name="contacttype"
            multiple
            value={localEnquiryData?.contacttype || []}
            onChange={handleContactTypeChange}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={value} />
                ))}
              </Box>
            )}
          >
            {contactTypeOptions.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Product Selection */}
        <TextField
          label="Search Products"
          variant="outlined"
          fullWidth
          margin="normal"
          value={productSearchTerm}
          onChange={handleProductSearchChange}
        />
        <List sx={{ width: '100%', maxHeight: 300, overflow: 'auto' }}>
          {products.map((product) => (
            <ListItem key={product.product_id} dense>
              <Checkbox
                edge="start"
                checked={Boolean(selectedProducts[product.product_id])}
                tabIndex={-1}
                disableRipple
                onClick={() => handleProductToggle(product)}
              />
              <ListItemText
                primary={`${product.item_name} (${product.model_number || 'No Model'})`}
                secondary={`Price: ₹${parsePrice(product.price).toFixed(2)} | Company: ${product.company_name}`}
              />
              {selectedProducts[product.product_id] && (
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                  <IconButton
                    size="small"
                    onClick={() => handleQuantityChange(product.product_id, -1)}
                    color="primary"
                  >
                    -
                  </IconButton>
                  <Typography sx={{ mx: 1 }}>
                    {selectedProducts[product.product_id].quantity}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleQuantityChange(product.product_id, 1)}
                    color="primary"
                  >
                    +
                  </IconButton>
                </Box>
              )}
            </ListItem>
          ))}
        </List>
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <Pagination
            count={Math.ceil(totalProducts / ITEMS_PER_PAGE)}
            page={page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
        <Typography variant="h6" sx={{ mt: 2 }}>
          Total Estimate: ₹{totalEstimate.toFixed(2)}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDialogClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleFormSubmission} color="primary" disabled={!isInitialized}>
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditEnquiryDialog;