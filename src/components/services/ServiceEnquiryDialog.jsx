import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogActions, DialogContent, DialogTitle, Button, TextField, Checkbox, FormControlLabel, IconButton, Typography, Box, Grid, Paper, Divider, MenuItem, Select, FormControl, InputLabel, Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import dayjs from 'dayjs';
import { supabase } from '../../supabaseClient';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[3],
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  fontWeight: 600,
  color: theme.palette.primary.main,
}));

const StyledButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.error.main,
}));

const ServiceEnquiryDialog = ({ dialogOpen, handleDialogClose, handleFormSubmit, editingEnquiry, techniciansOptions }) => {
  const [formData, setFormData] = useState({
    date: dayjs(),
    jobCardNo: '',
    customerName: '',
    customerMobile: '',
    customerRemarks: '',
    complaintType: [],
    complaints: [''],
    parts: [{ partId: '', partName: '', partNumber: '', qty: 1, rate: 0, amount: 0 }],
    technicians: [],
    charges: { oil: 0, petrol: 0, labour: 0 },
    totalAmount: 0,
    repairDate: null,
    expectedCompletionDate: null,
    expectedDeliveryDate: null,
    status: 'started',
  });
  const [partsOptions, setPartsOptions] = useState([]);

  useEffect(() => {
    const fetchParts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories!inner(category_id, category_name)')
        .eq('categories.category_name', 'Service');

      if (error) {
        console.error('Error fetching parts:', error);
      } else {
        setPartsOptions(data);
      }
    };

    fetchParts();

    if (editingEnquiry) {
      const parsedComplaintType = JSON.parse(editingEnquiry.machine_type);
      const parsedComplaints = JSON.parse(editingEnquiry.complaints);
      const parsedCharges = JSON.parse(editingEnquiry.charges);
      const repairDate = editingEnquiry.repair_date ? dayjs(editingEnquiry.repair_date) : null;
      const expectedCompletionDate = editingEnquiry.expected_completion_date ? dayjs(editingEnquiry.expected_completion_date) : null;
      const expectedDeliveryDate = editingEnquiry.expected_delivery_date ? dayjs(editingEnquiry.expected_delivery_date) : null;

      setFormData({
        date: dayjs(editingEnquiry.date),
        jobCardNo: editingEnquiry.job_card_no,
        customerName: editingEnquiry.customer_name,
        customerMobile: editingEnquiry.customer_mobile,
        customerRemarks: editingEnquiry.customer_remarks,
        complaintType: parsedComplaintType,
        complaints: parsedComplaints,
        parts: editingEnquiry.service_enquiry_parts.map(part => ({
          partId: part.part_id,
          partName: part.part_name,
          partNumber: part.part_number,
          qty: part.qty,
          rate: part.rate,
          amount: part.amount
        })),
        technicians: editingEnquiry.technician_name ? editingEnquiry.technician_name.split(', ').map(name => {
          const tech = techniciansOptions.find(t => t.name === name);
          return tech ? tech.id : null;
        }).filter(id => id !== null) : [],
        charges: parsedCharges,
        totalAmount: editingEnquiry.total_amount,
        repairDate: repairDate,
        expectedCompletionDate: expectedCompletionDate,
        expectedDeliveryDate: expectedDeliveryDate,
        status: editingEnquiry.status
      });
    }
  }, [editingEnquiry, techniciansOptions]);

  useEffect(() => {
    calculateTotalAmount();
  }, [formData.parts, formData.charges]);

  const handleChange = (e, index, field) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => {
      let newData = { ...prevData };

      if (field) {
        newData.parts = [...prevData.parts];
        newData.parts[index] = { ...newData.parts[index], [field]: value };

        if (field === 'partId') {
          fetchPartPrice(value, index);
        } else if (field === 'qty' || field === 'rate') {
          const qty = field === 'qty' ? parseFloat(value) || 0 : parseFloat(newData.parts[index].qty) || 0;
          const rate = field === 'rate' ? parseFloat(value) || 0 : parseFloat(newData.parts[index].rate) || 0;
          newData.parts[index].amount = qty * rate;
        }
      } else if (type === 'checkbox') {
        newData.complaintType = checked
          ? [...prevData.complaintType, value]
          : prevData.complaintType.filter((item) => item !== value);
      } else if (name.startsWith('charges.')) {
        const chargeField = name.split('.')[1];
        newData.charges = { ...prevData.charges, [chargeField]: parseFloat(value) || 0 };
      } else {
        newData[name] = value;
      }

      return newData;
    });
  };

  const handleComplaintsChange = (e, index) => {
    const newComplaints = [...formData.complaints];
    newComplaints[index] = e.target.value;
    setFormData({ ...formData, complaints: newComplaints });
  };

  const handleTechnicianChange = (event) => {
    const {
      target: { value },
    } = event;
    setFormData({
      ...formData,
      technicians: typeof value === 'string' ? value.split(',') : value,
    });
  };

  const fetchPartPrice = async (partId, index) => {
    const { data, error } = await supabase
      .from('products')
      .select('price, item_name, barcode_number')
      .eq('product_id', partId)
      .single();

    if (error) {
      console.error('Error fetching part price:', error);
      return;
    }

    setFormData((prevData) => {
      const newParts = [...prevData.parts];
      newParts[index] = {
        ...newParts[index],
        rate: data.price,
        amount: data.price * (parseFloat(newParts[index].qty) || 1),
        partName: data.item_name,
        partNumber: data.barcode_number,
      };
      return { ...prevData, parts: newParts };
    });
  };

  const calculateTotalAmount = () => {
    const partsTotal = formData.parts.reduce((sum, part) => sum + (part.amount || 0), 0);
    const chargesTotal = Object.values(formData.charges).reduce((sum, charge) => sum + parseFloat(charge || 0), 0);
    const total = partsTotal + chargesTotal;

    setFormData((prevData) => ({
      ...prevData,
      totalAmount: total.toFixed(2)
    }));
  };

  const addItem = (type) => {
    setFormData((prevData) => ({
      ...prevData,
      [type]: type === 'parts'
        ? [...prevData[type], { partId: '', partName: '', partNumber: '', qty: 1, rate: 0, amount: 0 }]
        : [...prevData[type], '']
    }));
  };

  const removeItem = (type, index) => {
    setFormData((prevData) => ({
      ...prevData,
      [type]: prevData[type].filter((_, i) => i !== index)
    }));
  };

  const renderInputField = (label, name, type = 'text') => (
    <TextField
      name={name}
      label={label}
      type={type}
      variant="outlined"
      fullWidth
      margin="dense"
      value={formData[name]}
      onChange={handleChange}
    />
  );

  const renderCheckbox = (value, options) => {
    if (!options || !Array.isArray(options)) {
      return false;
    }
    return options.includes(value);
  };

  const handleSubmit = async () => {
    try {
      console.log('Submitting form data:', formData);
  
      const complaintsJson = JSON.stringify(formData.complaints);
      const complaintTypeJson = JSON.stringify(formData.complaintType);
      const chargesJson = JSON.stringify(formData.charges);
  
      const serviceEnquiryData = {
        date: formData.date.toISOString(),
        job_card_no: formData.jobCardNo,
        customer_name: formData.customerName,
        customer_mobile: formData.customerMobile,
        customer_remarks: formData.customerRemarks,
        machine_type: complaintTypeJson,
        complaints: complaintsJson,
        technician_name: formData.technicians.map(id => techniciansOptions.find(tech => tech.id === id)?.name).join(', '),
        charges: chargesJson,
        total_amount: parseFloat(formData.totalAmount),
        repair_date: formData.repairDate ? formData.repairDate.toISOString() : null,
        expected_completion_date: formData.expectedCompletionDate ? formData.expectedCompletionDate.toISOString() : null,
        expected_delivery_date: formData.expectedDeliveryDate ? formData.expectedDeliveryDate.toISOString() : null,
        status: formData.status
      };
  
      let serviceEnquiry;
      if (editingEnquiry) {
        const { data, error: serviceEnquiryError } = await supabase
          .from('service_enquiries')
          .update(serviceEnquiryData)
          .eq('id', editingEnquiry.id)
          .select()
          .single();
  
        if (serviceEnquiryError) throw serviceEnquiryError;
        serviceEnquiry = data;
  
        // Track and save technician changes
        const oldTechnicians = editingEnquiry.technician_name ? editingEnquiry.technician_name.split(', ') : [];
        const newTechnicians = formData.technicians.map(id => techniciansOptions.find(tech => tech.id === id)?.name);
  
        if (JSON.stringify(oldTechnicians) !== JSON.stringify(newTechnicians)) {
          const changes = {
            oldTechnicians,
            newTechnicians,
            changedAt: new Date().toISOString()
          };
          await supabase
            .from('technician_changes')
            .insert({ service_id: serviceEnquiry.id, changes: JSON.stringify(changes) });
        }
  
        // Delete old parts and insert new parts
        await supabase.from('service_enquiry_parts').delete().eq('service_enquiry_id', editingEnquiry.id);
      } else {
        const { data, error: serviceEnquiryError } = await supabase
          .from('service_enquiries')
          .insert(serviceEnquiryData)
          .select()
          .single();
  
        if (serviceEnquiryError) throw serviceEnquiryError;
        serviceEnquiry = data;
      }
  
      const partsData = formData.parts.map(part => ({
        service_enquiry_id: serviceEnquiry.id,
        part_id: parseInt(part.partId),
        part_name: part.partName,
        part_number: part.partNumber,
        qty: parseInt(part.qty),
        rate: parseFloat(part.rate),
        amount: parseFloat(part.amount)
      }));
  
      const { data: parts, error: partsError } = await supabase
        .from('service_enquiry_parts')
        .insert(partsData);
  
      if (partsError) throw partsError;
  
      console.log('Parts inserted:', parts);
  
      handleFormSubmit();
      handleDialogClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      // Handle the error, e.g., show a notification to the user
    }
  };
  

  return (
    <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ mb: 2 }}>
        {editingEnquiry ? 'Edit Service Enquiry' : 'Add Service Enquiry'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <StyledPaper elevation={3}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Date"
                    value={formData.date}
                    onChange={(date) => handleChange({ target: { name: 'date', value: date } })}
                    slotProps={{ textField: { fullWidth: true, margin: 'dense' } }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6}>
                {renderInputField('Job Card No', 'jobCardNo')}
              </Grid>
            </Grid>
            {renderInputField('Customer Name', 'customerName')}
            {renderInputField('Customer Mobile', 'customerMobile')}
            {renderInputField('Customer Remarks', 'customerRemarks')}
          </StyledPaper>

          <StyledPaper elevation={3}>
            <StyledTypography variant="h6">Complaint Type</StyledTypography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {['Blade', 'Tap n go', 'Cup/Cup Nut', 'Side Cover, Nut', 'Bar, Bar Cover', 'Chain', 'Air filter/Cover', 'Engine only', 'Paid Service', 'With Transmission', 'Hose & Gun'].map((type) =>
                <FormControlLabel
                  key={type}
                  control={
                    <Checkbox
                      checked={renderCheckbox(type, formData.complaintType)}
                      onChange={(e) => handleChange(e)}
                      value={type}
                    />
                  }
                  label={type}
                />
              )}
            </Box>

            <StyledTypography variant="h6">Machine type & Complaints</StyledTypography>
            {formData.complaints.map((complaint, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  name={`complaints.${index}`}
                  type="text"
                  variant="outlined"
                  fullWidth
                  margin="dense"
                  value={complaint}
                  onChange={(e) => handleComplaintsChange(e, index)}
                />
                <StyledIconButton onClick={() => removeItem('complaints', index)}>
                  <RemoveCircleIcon />
                </StyledIconButton>
              </Box>
            ))}
            <StyledButton onClick={() => addItem('complaints')} variant="contained" startIcon={<AddCircleIcon />}>
              Add Complaint
            </StyledButton>

            <StyledTypography variant="h6">Parts</StyledTypography>
            {formData.parts.map((part, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <FormControl fullWidth margin="dense">
                  <InputLabel>Part</InputLabel>
                  <Select
                    name="parts"
                    value={part.partId}
                    onChange={(e) => handleChange(e, index, 'partId')}
                    label="Part"
                  >
                    <MenuItem value="" disabled>Select a part</MenuItem>
                    {partsOptions.map((option) => (
                      <MenuItem key={option.product_id} value={option.product_id}>
                        {option.item_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  name="parts"
                  label="Qty"
                  type="number"
                  value={part.qty}
                  onChange={(e) => handleChange(e, index, 'qty')}
                  sx={{ width: '100px' }}
                />
                <TextField
                  name="parts"
                  label="Rate"
                  type="number"
                  value={part.rate}
                  onChange={(e) => handleChange(e, index, 'rate')}
                  sx={{ width: '100px' }}
                />
                <TextField
                  name="parts"
                  label="Amount"
                  type="number"
                  value={part.amount}
                  InputProps={{ readOnly: true }}
                  sx={{ width: '100px' }}
                />
                <StyledIconButton onClick={() => removeItem('parts', index)}>
                  <RemoveCircleIcon />
                </StyledIconButton>
              </Box>
            ))}
            <StyledButton onClick={() => addItem('parts')} variant="contained" startIcon={<AddCircleIcon />}>
              Add Part
            </StyledButton>
          </StyledPaper>

          <StyledPaper elevation={3}>
            <FormControl fullWidth margin="dense">
              <InputLabel>Technicians</InputLabel>
              <Select
                multiple
                value={formData.technicians}
                onChange={handleTechnicianChange}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={techniciansOptions.find((tech) => tech.id === value)?.name} />
                    ))}
                  </Box>
                )}
              >
                {techniciansOptions.map((technician) => (
                  <MenuItem key={technician.id} value={technician.id}>
                    {technician.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <StyledTypography variant="h6">Charges</StyledTypography>
            <Grid container spacing={2}>
              {Object.keys(formData.charges).map((charge) => (
                <Grid item xs={12} sm={4} key={charge}>
                  <TextField
                    name={`charges.${charge}`}
                    label={charge.charAt(0).toUpperCase() + charge.slice(1)}
                    type="number"
                    variant="outlined"
                    fullWidth
                    margin="dense"
                    value={formData.charges[charge]}
                    onChange={handleChange}
                  />
                </Grid>
              ))}
            </Grid>
            <TextField
              name="totalAmount"
              label="Total Amount"
              type="number"
              variant="outlined"
              fullWidth
              margin="dense"
              value={formData.totalAmount}
              InputProps={{ readOnly: true }}
            />
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Expected Completion Date"
                value={formData.expectedCompletionDate}
                onChange={(date) => handleChange({ target: { name: 'expectedCompletionDate', value: date } })}
                slotProps={{ textField: { fullWidth: true, margin: 'dense' } }}
              />
              <DatePicker
                label="Expected Delivery/Followup Date"
                value={formData.expectedDeliveryDate}
                onChange={(date) => handleChange({ target: { name: 'expectedDeliveryDate', value: date } })}
                slotProps={{ textField: { fullWidth: true, margin: 'dense' } }}
              />
              <DatePicker
                label="Repair Date"
                value={formData.repairDate}
                onChange={(date) => {
                  handleChange({ target: { name: 'repairDate', value: date } });
                  if (date) {
                    setFormData(prevData => ({ ...prevData, status: 'completed' }));
                  }
                }}
                slotProps={{ textField: { fullWidth: true, margin: 'dense' } }}
              />
            </LocalizationProvider>
          </StyledPaper>

          <StyledPaper elevation={3}>
            <FormControl fullWidth margin="dense">
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={handleChange}
                label="Status"
              >
                <MenuItem value="started">Started</MenuItem>
                <MenuItem value="ongoing">Ongoing</MenuItem>
                <MenuItem value="paused">Paused</MenuItem>
                <MenuItem value="paused due to parts unavailability">Paused due to Parts Unavailability</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="delivered">Delivered</MenuItem>
              </Select>
            </FormControl>
          </StyledPaper>
        </Box>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleDialogClose} color="primary" variant="outlined">
          Cancel
        </Button>
        <Button onClick={handleSubmit} color="primary" variant="contained">
          {editingEnquiry ? 'Update Service Enquiry' : 'Add Service Enquiry'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ServiceEnquiryDialog;
