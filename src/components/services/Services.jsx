import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, IconButton, TextField, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Menu, MenuItem, Tooltip, Snackbar, Alert, Pagination
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Build as BuildIcon, ArrowDropDown as ArrowDropDownIcon
} from '@mui/icons-material';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import { styled } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { supabase } from '../../supabaseClient';
import ServiceEnquiryDialog from './ServiceEnquiryDialog';
import TechnicianDialog from './TechnicianDialog';
import TechnicianChangesDialog from './TechnicianChangesDialog';
import QuickAnalytics from './QuickAnalytics';

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

const FilterSelect = ({ label, value, handleChange, options, withDatePicker, startDate, endDate, handleStartDateChange, handleEndDateChange }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (selectedValue) => {
    handleChange(selectedValue);
    handleClose();
  };

  return (
    <Box display="flex" alignItems="center">
      <Tooltip title={`Filter by ${label}`}>
        <button
          className={`py-2 px-4 rounded-full border ${anchorEl ? 'border-blue-600 bg-blue-100' : 'border-gray-300'} focus:outline-none transition duration-150 ease-in-out`}
          onClick={handleOpen}
        >
          {value || label}
          <ArrowDropDownIcon className="ml-1" />
        </button>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {options.map((option) => (
          <MenuItem key={option} onClick={() => handleSelect(option)}>
            {option}
          </MenuItem>
        ))}
        {withDatePicker && (
          <Box p={2}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={handleStartDateChange}
                renderInput={(params) => <TextField {...params} size="small" />}
              />
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={handleEndDateChange}
                renderInput={(params) => <TextField {...params} size="small" />}
              />
            </LocalizationProvider>
          </Box>
        )}
      </Menu>
    </Box>
  );
};

const dateOptions = ['See All', 'This Month', 'Last 30 Days', 'Last 60 Days', 'Custom Date Range'];

const Services = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [technicianDialogOpen, setTechnicianDialogOpen] = useState(false);
  const [technicianChangesDialogOpen, setTechnicianChangesDialogOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [technicianFilter, setTechnicianFilter] = useState('See All');
  const [statusFilter, setStatusFilter] = useState('See All');
  const [dateFilter, setDateFilter] = useState('Last 30 Days');
  const [startDate, setStartDate] = useState(dayjs().subtract(30, 'day'));
  const [endDate, setEndDate] = useState(dayjs());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingEnquiry, setEditingEnquiry] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [techniciansOptions, setTechniciansOptions] = useState([]);
  const [statusMenuAnchorEl, setStatusMenuAnchorEl] = useState(null);
  const [statusMenuEnquiry, setStatusMenuEnquiry] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 50;

  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_enquiries')
        .select('*, service_enquiry_parts(*)');
      if (error) throw error;
      setEnquiries(data);
    } catch (error) {
      setError(error.message);
      console.error("Error fetching enquiries:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTechnicians = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('technicians')
        .select('*');
      if (error) throw error;
      setTechniciansOptions(data);
    } catch (error) {
      setError(error.message);
      console.error("Error fetching technicians:", error);
    }
  }, []);

  useEffect(() => {
    fetchEnquiries();
    fetchTechnicians();
  }, [fetchEnquiries, fetchTechnicians]);

  useEffect(() => {
    const filterEnquiries = () => {
      let filtered = enquiries;
      if (searchTerm) {
        filtered = filtered.filter(enquiry =>
          enquiry.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          enquiry.customer_mobile.includes(searchTerm) ||
          enquiry.job_card_no.includes(searchTerm)
        );
      }
      if (technicianFilter && technicianFilter !== 'See All') {
        filtered = filtered.filter(enquiry =>
          enquiry.technician_name && enquiry.technician_name.split(', ').includes(technicianFilter)
        );
      }
      if (statusFilter && statusFilter !== 'See All') {
        filtered = filtered.filter(enquiry => enquiry.status === statusFilter);
      }
      if (dateFilter === 'This Month') {
        filtered = filtered.filter(enquiry =>
          dayjs(enquiry.date).isAfter(dayjs().startOf('month'))
        );
      } else if (dateFilter === 'Last 30 Days') {
        filtered = filtered.filter(enquiry =>
          dayjs(enquiry.date).isAfter(dayjs().subtract(30, 'day'))
        );
      } else if (dateFilter === 'Last 60 Days') {
        filtered = filtered.filter(enquiry =>
          dayjs(enquiry.date).isAfter(dayjs().subtract(60, 'day'))
        );
      } else if (dateFilter === 'Custom Date Range') {
        filtered = filtered.filter(enquiry =>
          dayjs(enquiry.date).isAfter(startDate) && dayjs(enquiry.date).isBefore(endDate)
        );
      }
      setFilteredEnquiries(filtered);
    };

    filterEnquiries();
  }, [searchTerm, technicianFilter, statusFilter, dateFilter, startDate, endDate, enquiries]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleTechnicianFilterChange = (value) => {
    setTechnicianFilter(value);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
  };

  const handleDateFilterChange = (value) => {
    setDateFilter(value);
  };

  const handleAddEnquiryClick = () => {
    setEditingEnquiry(null);
    setDialogOpen(true);
  };

  const handleEditEnquiry = (enquiry) => {
    setEditingEnquiry(enquiry);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingEnquiry(null);
  };

  const handleFormSubmit = async (data) => {
    const { expected_delivery_date, ...otherFields } = data;
    const updateData = {
      ...otherFields,
      expected_delivery_date: expected_delivery_date ? expected_delivery_date.toISOString() : null,
    };

    try {
      const { error } = editingEnquiry
        ? await supabase.from('service_enquiries').update(updateData).eq('id', editingEnquiry.id)
        : await supabase.from('service_enquiries').insert(updateData);

      if (error) throw error;
      fetchEnquiries();
      showSnackbar('Enquiry saved successfully', 'success');
      handleDialogClose();
    } catch (error) {
      showSnackbar('Error saving enquiry', 'error');
      console.error("Error saving enquiry:", error);
    }
  };

  const handleDeleteEnquiry = async (id) => {
    if (window.confirm('Are you sure you want to delete this enquiry?')) {
      try {
        const { error: partsError } = await supabase
          .from('service_enquiry_parts')
          .delete()
          .eq('service_enquiry_id', id);

        if (partsError) throw partsError;

        const { error } = await supabase
          .from('service_enquiries')
          .delete()
          .eq('id', id);

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

  const handleStatusMenuOpen = (event, enquiry) => {
    setStatusMenuAnchorEl(event.currentTarget);
    setStatusMenuEnquiry(enquiry);
  };

  const handleStatusMenuClose = () => {
    setStatusMenuAnchorEl(null);
    setStatusMenuEnquiry(null);
  };

  const handleStatusChange = async (status) => {
    if (status === 'completed') {
      if (!window.confirm('Are you sure you want to set the status to completed? This action cannot be undone and will adjust the stock accordingly.')) {
        handleStatusMenuClose();
        return;
      }

      // Adjust the stock
      const parts = statusMenuEnquiry.service_enquiry_parts;
      try {
        for (const part of parts) {
          let remainingQty = part.qty;

          while (remainingQty > 0) {
            const { data: batchData, error: batchError } = await supabase
              .from('batches')
              .select('*')
              .eq('product_id', part.part_id)
              .gt('current_stock', 0)
              .order('expiry_date', { ascending: true })
              .limit(1)
              .single();

            if (batchError) throw batchError;

            if (!batchData) throw new Error(`Not enough stock for part ${part.part_name}`);

            const batchUpdate = {
              current_stock: batchData.current_stock - remainingQty,
            };

            if (batchUpdate.current_stock < 0) {
              remainingQty = -batchUpdate.current_stock;
              batchUpdate.current_stock = 0;
            } else {
              remainingQty = 0;
            }

            const { error: updateError } = await supabase
              .from('batches')
              .update(batchUpdate)
              .eq('batch_id', batchData.batch_id);

            if (updateError) throw updateError;

            const { data: productData, error: productError } = await supabase
              .from('products')
              .select('current_stock')
              .eq('product_id', part.part_id)
              .single();

            if (productError) throw productError;

            const productUpdate = {
              current_stock: productData.current_stock - part.qty,
            };

            const { error: productUpdateError } = await supabase
              .from('products')
              .update(productUpdate)
              .eq('product_id', part.part_id);

            if (productUpdateError) throw productUpdateError;
          }
        }

        const { error: statusUpdateError } = await supabase
          .from('service_enquiries')
          .update({ status })
          .eq('id', statusMenuEnquiry.id);

        if (statusUpdateError) throw statusUpdateError;

        fetchEnquiries();
        showSnackbar('Status updated successfully', 'success');
        handleStatusMenuClose();
      } catch (error) {
        console.error('Error updating status:', error);
        showSnackbar('Error updating status', 'error');
        handleStatusMenuClose();
      }
    } else {
      try {
        const { error } = await supabase
          .from('service_enquiries')
          .update({ status })
          .eq('id', statusMenuEnquiry.id);
        if (error) throw error;
        fetchEnquiries();
        showSnackbar('Status updated successfully', 'success');
        handleStatusMenuClose();
      } catch (error) {
        console.error('Error updating status:', error);
        showSnackbar('Error updating status', 'error');
        handleStatusMenuClose();
      }
    }
  };

  const handleManageTechnicians = () => {
    setTechnicianDialogOpen(true);
  };

  const handleTechnicianFieldClick = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setTechnicianChangesDialogOpen(true);
  };

  const handleTechnicianChangesDialogClose = () => {
    setTechnicianChangesDialogOpen(false);
    setSelectedEnquiry(null);
  };

  const getTechnicianPerformance = () => {
    const performance = {};
    filteredEnquiries.forEach((enquiry) => {
      const technicians = enquiry.technician_name ? enquiry.technician_name.split(', ') : [];
      technicians.forEach((technician) => {
        if (!performance[technician]) {
          performance[technician] = { completed: 0, ongoing: 0, total: 0 };
        }
        performance[technician].total += 1;
        if (enquiry.status === 'completed') {
          performance[technician].completed += 1;
        } else {
          performance[technician].ongoing += 1;
        }
      });
    });
    return performance;
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">Error: {error}</Typography>;

  const technicianPerformance = getTechnicianPerformance();
  const totalIncome = filteredEnquiries.reduce((acc, enquiry) => acc + (enquiry.total_amount || 0), 0);
  const totalPages = Math.ceil(filteredEnquiries.length / entriesPerPage);
  const displayedEnquiries = filteredEnquiries.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

  return (
    <Box className="flex flex-col min-h-screen bg-gray-100">
      <Box className="bg-white shadow-md p-4">
        <Box className="max-w-7xl mx-auto flex justify-between items-center">
          <Box className="flex items-center space-x-4">
            <BuildIcon className="text-blue-500" style={{ fontSize: '1.75rem' }} />
            <h1 className="text-xl font-semibold ml-2">Service</h1>
            <FilterSelect
              label="Date Range"
              value={dateFilter}
              handleChange={handleDateFilterChange}
              options={dateOptions}
              withDatePicker={dateFilter === 'Custom Date Range'}
              startDate={startDate}
              endDate={endDate}
              handleStartDateChange={setStartDate}
              handleEndDateChange={setEndDate}
            />
          </Box>
          <Box className="flex items-center space-x-4">
            <TextField
              placeholder="Search for enquiries"
              value={searchTerm}
              onChange={handleSearchChange}
              variant="outlined"
              size="small"
            />
            <Tooltip title="Add new enquiry">
              <IconButton
                onClick={handleAddEnquiryClick}
                style={{ backgroundColor: '#e3f2fd', color: '#1e88e5', borderRadius: '12px' }}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Manage technicians">
              <IconButton
                onClick={handleManageTechnicians}
                style={{ backgroundColor: '#e3f2fd', color: '#1e88e5', borderRadius: '12px' }}
              >
                <DesignServicesIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      <QuickAnalytics 
        totalIncome={totalIncome} 
        technicianPerformance={technicianPerformance} 
        filteredEnquiries={filteredEnquiries} 
      />

      <Box className="flex-grow p-4">
        <TableContainer component={Paper} className="shadow-md rounded-lg overflow-hidden">
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <StyledTableCell>No.</StyledTableCell>
                <StyledTableCell>Date</StyledTableCell>
                <StyledTableCell>Job Card No</StyledTableCell>
                <StyledTableCell>Customer Name</StyledTableCell>
                <StyledTableCell>Customer Mobile</StyledTableCell>
                <StyledTableCell>
                  <FilterSelect 
                    label="Technician"
                    value={technicianFilter}
                    handleChange={handleTechnicianFilterChange}
                    options={['See All', ...techniciansOptions.map(tech => tech.name)]}
                  />
                </StyledTableCell>
                <StyledTableCell>Total Amount</StyledTableCell>
                <StyledTableCell>
                  <FilterSelect 
                    label="Status"
                    value={statusFilter}
                    handleChange={handleStatusFilterChange}
                    options={['See All', 'started', 'ongoing', 'paused', 'completed','delivered']}
                  />
                </StyledTableCell>
                <StyledTableCell>Expected Completion</StyledTableCell>
                <StyledTableCell>Expected Delivery Date</StyledTableCell>
                <StyledTableCell>Actions</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedEnquiries.length > 0 ? (
                displayedEnquiries.map((enquiry, index) => (
                  <StyledTableRow key={enquiry.id}>
                    <TableCell align="center">{(currentPage - 1) * entriesPerPage + index + 1}</TableCell>
                    <TableCell>{new Date(enquiry.date).toLocaleDateString()}</TableCell>
                    <TableCell>{enquiry.job_card_no}</TableCell>
                    <TableCell>{enquiry.customer_name}</TableCell>
                    <TableCell>{enquiry.customer_mobile}</TableCell>
                    <TableCell>
                      <span
                        style={{ cursor: 'pointer', color: 'blue' }}
                        onClick={() => handleTechnicianFieldClick(enquiry)}
                      >
                        {enquiry.technician_name}
                      </span>
                    </TableCell>
                    <TableCell>
                      {enquiry.total_amount != null ? `${enquiry.total_amount.toFixed(2)}` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Typography>{enquiry.status}</Typography>
                        <IconButton size="small" onClick={(event) => handleStatusMenuOpen(event, enquiry)}>
                          <ArrowDropDownIcon />
                        </IconButton>
                        <Menu
                          anchorEl={statusMenuAnchorEl}
                          open={Boolean(statusMenuAnchorEl) && statusMenuEnquiry === enquiry}
                          onClose={handleStatusMenuClose}
                        >
                          {['started', 'ongoing', 'paused', 'completed','delivered'].map(status => (
                            <MenuItem key={status} onClick={() => handleStatusChange(status)}>
                              {status}
                            </MenuItem>
                          ))}
                        </Menu>
                      </Box>
                    </TableCell>
                    <TableCell>{new Date(enquiry.expected_completion_date).toLocaleDateString()}</TableCell>
                    <TableCell>{enquiry.expected_delivery_date ? new Date(enquiry.expected_delivery_date).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEditEnquiry(enquiry)} color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteEnquiry(enquiry.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </StyledTableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    No data to display
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Box display="flex" justifyContent="center" mt={2}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(e, page) => setCurrentPage(page)}
            variant="outlined"
            color="primary"
          />
        </Box>
      </Box>

      <ServiceEnquiryDialog
        dialogOpen={dialogOpen}
        handleDialogClose={handleDialogClose}
        handleFormSubmit={handleFormSubmit}
        editingEnquiry={editingEnquiry}
        techniciansOptions={techniciansOptions}
      />

      <TechnicianDialog
        open={technicianDialogOpen}
        onClose={() => setTechnicianDialogOpen(false)}
      />

      <TechnicianChangesDialog
        open={technicianChangesDialogOpen}
        onClose={handleTechnicianChangesDialogClose}
        enquiry={selectedEnquiry}
      />

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
    </Box>
  );
};

export default Services;
