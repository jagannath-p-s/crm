import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  TableSortLabel,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
  Button,
  Snackbar,
  Alert,
  Grid,
  Box,
  Container,
  InputAdornment
} from '@mui/material';
import {
  Print as PrintIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import ReactToPrint from 'react-to-print';

const Dash = () => {
  const [bills, setBills] = useState([]);
  const [filter, setFilter] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);
  const [selectedBillItems, setSelectedBillItems] = useState([]);
  const [editBill, setEditBill] = useState({ waiting_number: '', job_card_number: '' });
  const [printInfo, setPrintInfo] = useState({ printedBy: 'Admin', printedAt: new Date() });
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('waiting_number');
  const [openDialog, setOpenDialog] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const componentRef = useRef();

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    const { data, error } = await supabase
      .from('bills')
      .select('*, bill_items(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bills:', error);
      showSnackbar(`Error fetching bills: ${error.message}`, 'error');
    } else {
      setBills(data);
    }
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const handleRequestSort = (property) => {
    const isAscending = orderBy === property && order === 'asc';
    setOrder(isAscending ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedBills = bills.sort((a, b) => {
    if (orderBy === 'waiting_number') {
      if (!a.waiting_number && !b.waiting_number) return 0;
      if (!a.waiting_number) return 1;
      if (!b.waiting_number) return -1;
      return order === 'asc'
        ? a.waiting_number.localeCompare(b.waiting_number, undefined, { numeric: true, sensitivity: 'base' })
        : b.waiting_number.localeCompare(a.waiting_number, undefined, { numeric: true, sensitivity: 'base' });
    } else {
      if (orderBy === 'customer_name') {
        return (order === 'asc' ? a.customer_name.localeCompare(b.customer_name) : b.customer_name.localeCompare(a.customer_name));
      } else if (orderBy === 'job_card_number') {
        return (order === 'asc' ? a.job_card_number.localeCompare(b.job_card_number) : b.job_card_number.localeCompare(a.job_card_number));
      } else if (orderBy === 'total_amount') {
        return (order === 'asc' ? a.total_amount - b.total_amount : b.total_amount - a.total_amount);
      } else {
        return (order === 'asc' ? new Date(a.created_at) - new Date(b.created_at) : new Date(b.created_at) - new Date(a.created_at));
      }
    }
  });

  const filteredBills = sortedBills.filter((bill) => {
    const searchString = filter.toLowerCase();
    return (
      bill.customer_name.toLowerCase().includes(searchString) ||
      bill.job_card_number.toLowerCase().includes(searchString) ||
      (bill.waiting_number && bill.waiting_number.toLowerCase().includes(searchString))
    );
  });

  const handlePrintBill = async (billId) => {
    const { data, error } = await supabase
      .from('bills')
      .select('*, bill_items(*)')
      .eq('bill_id', billId)
      .single();

    if (error) {
      console.error('Error fetching bill details:', error);
      showSnackbar(`Error fetching bill details: ${error.message}`, 'error');
      return;
    }

    setSelectedBill(data);
    setSelectedBillItems(data.bill_items);
    setPrintInfo({ printedBy: 'Admin', printedAt: new Date() });
    setOpenDialog(true);
  };

  const handleConfirmPrint = () => {
    setOpenDialog(false);
  };

  const handleDeleteBill = async () => {
    try {
      const { error: itemsError } = await supabase
        .from('bill_items')
        .delete()
        .eq('bill_id', selectedBill.bill_id);

      if (itemsError) {
        throw new Error(`Error deleting bill items: ${itemsError.message}`);
      }

      const { error: billError } = await supabase
        .from('bills')
        .delete()
        .eq('bill_id', selectedBill.bill_id);

      if (billError) {
        throw new Error(`Error deleting bill: ${billError.message}`);
      }

      showSnackbar('Bill deleted successfully', 'success');
      fetchBills();
    } catch (error) {
      console.error('Error deleting bill:', error);
      showSnackbar(error.message, 'error');
    }

    setDeleteDialogOpen(false);
  };

  const handleOpenDeleteDialog = (bill) => {
    setSelectedBill(bill);
    setDeleteDialogOpen(true);
  };

  const handleOpenEditDialog = (bill) => {
    setSelectedBill(bill);
    setEditBill({ waiting_number: bill.waiting_number, job_card_number: bill.job_card_number });
    setEditDialogOpen(true);
  };

  const handleEditBillChange = (e) => {
    const { name, value } = e.target;
    setEditBill((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
    try {
      const { error } = await supabase
        .from('bills')
        .update({ waiting_number: editBill.waiting_number, job_card_number: editBill.job_card_number })
        .eq('bill_id', selectedBill.bill_id);

      if (error) {
        throw new Error(`Error updating bill: ${error.message}`);
      }

      showSnackbar('Bill updated successfully', 'success');
      fetchBills();
    } catch (error) {
      console.error('Error updating bill:', error);
      showSnackbar(error.message, 'error');
    }

    setEditDialogOpen(false);
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

  const totalBills = filteredBills.length;
  const totalAmount = filteredBills.reduce((sum, bill) => sum + (bill.total_amount || 0), 0);

  const PrintableBill = React.forwardRef(({ bill, billItems, printedBy, printedAt }, ref) => {
    const totalAmount = billItems.reduce((sum, item) => sum + (item.amount || 0), 0);

    return (
      <div ref={ref} style={{ padding: '20px', fontFamily: 'Arial' }}>
        <h1 style={{ textAlign: 'center', fontSize: '24px', marginBottom: '20px' }}>Haritha Agritech</h1>
        <p style={{ textAlign: 'center', margin: '0' }}>
          AKKIKAVU, NEAR PERUMPILAVU<br />
          KUNNAMKULAM-KOZHIKODE ROAD<br />
          KERALA, INDIA<br />
          PH: 9747403390 | GSTIN: 29GGGGG1314R9Z6
        </p>
        <hr style={{ margin: '20px 0' }} />
        <p>
          <strong>Bill Date:</strong> {new Date(bill.created_at).toLocaleDateString()}<br />
          <strong>Customer Name:</strong> {bill.customer_name}<br />
          <strong>Job Card Number:</strong> {bill.job_card_number}<br />
          <strong>Waiting Number:</strong> {bill.waiting_number}<br />
          <strong>Pipeline:</strong> {bill.pipeline_name}
        </p>
        <TableContainer component={Paper} style={{ marginTop: '20px' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell>Qty</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Amt</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {billItems.map((item) => (
                <TableRow key={item.bill_item_id}>
                  <TableCell>{item.product_name}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.price}</TableCell>
                  <TableCell>{item.amount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <p style={{ marginTop: '20px', textAlign: 'right' }}><strong>Total: Rs. {totalAmount.toFixed(2)}</strong></p>
        <p style={{ textAlign: 'center', marginTop: '40px' }}>
          <strong>Thank You</strong><br />
          Printed by {printedBy} on {printedAt.toLocaleString()}
        </p>
      </div>
    );
  });

  return (
    <Container maxWidth="lg">
      <Box sx={{ flexGrow: 1, mt: 4 }}>
       
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Summary
                </Typography>
                <Typography variant="body1">
                  Total Bills: {totalBills}
                </Typography>
                <Typography variant="body1">
                  Total Amount: Rs. {totalAmount.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Search
                </Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  value={filter}
                  onChange={handleFilterChange}
                  placeholder="Search by customer, job card, or waiting number"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'customer_name'}
                        direction={orderBy === 'customer_name' ? order : 'asc'}
                        onClick={() => handleRequestSort('customer_name')}
                      >
                        Customer Name
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'job_card_number'}
                        direction={orderBy === 'job_card_number' ? order : 'asc'}
                        onClick={() => handleRequestSort('job_card_number')}
                      >
                        Job Card Number
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'waiting_number'}
                        direction={orderBy === 'waiting_number' ? order : 'asc'}
                        onClick={() => handleRequestSort('waiting_number')}
                      >
                        Waiting Number
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'total_amount'}
                        direction={orderBy === 'total_amount' ? order : 'asc'}
                        onClick={() => handleRequestSort('total_amount')}
                      >
                        Total Amount
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'created_at'}
                        direction={orderBy === 'created_at' ? order : 'asc'}
                        onClick={() => handleRequestSort('created_at')}
                      >
                        Created At
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredBills.map((bill) => (
                    <TableRow key={bill.bill_id}>
                      <TableCell>{bill.customer_name}</TableCell>
                      <TableCell>{bill.job_card_number}</TableCell>
                      <TableCell>{bill.waiting_number || 'N/A'}</TableCell>
                      <TableCell>Rs. {bill.total_amount.toFixed(2)}</TableCell>
                      <TableCell>{new Date(bill.created_at).toLocaleString()}</TableCell>
                      <TableCell>
                        <Tooltip title="Print">
                          <IconButton color="primary" onClick={() => handlePrintBill(bill.bill_id)}>
                            <PrintIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton color="primary" onClick={() => handleOpenEditDialog(bill)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton color="error" onClick={() => handleOpenDeleteDialog(bill)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>

      {/* Print Confirmation Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Confirm Print</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to print the bill for {selectedBill?.customer_name}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="primary">
            Cancel
          </Button>
          <ReactToPrint
            trigger={() => (
              <Button onClick={handleConfirmPrint} color="primary" variant="contained">
                Print Bill
              </Button>
            )}
            content={() => componentRef.current}
          />
        </DialogActions>
      </Dialog>

      {/* Edit Bill Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Bill</DialogTitle>
        <DialogContent>
          <TextField
            label="Waiting Number"
            variant="outlined"
            margin="normal"
            name="waiting_number"
            value={editBill.waiting_number}
            onChange={handleEditBillChange}
            fullWidth
          />
          <TextField
            label="Job Card Number"
            variant="outlined"
            margin="normal"
            name="job_card_number"
            value={editBill.job_card_number}
            onChange={handleEditBillChange}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSaveEdit} color="primary" variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the bill for {selectedBill?.customer_name}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteBill} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
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

      {/* Hidden printable bill component */}
      {selectedBill && (
        <div style={{ display: 'none' }}>
          <PrintableBill
            ref={componentRef}
            bill={selectedBill}
            billItems={selectedBillItems}
            printedBy={printInfo.printedBy}
            printedAt={printInfo.printedAt}
          />
        </div>
      )}
    </Container>
  );
};

export default Dash;
