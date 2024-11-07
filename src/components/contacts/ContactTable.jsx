import React, { useState } from 'react';
import {
  TextField,
  IconButton,
  Tooltip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Snackbar,
  Alert,
  Box,
  Typography,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

const ContactTable = ({ contacts }) => {
  const [selectedContact, setSelectedContact] = useState(null);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleOpenContactDialog = (contact) => {
    setSelectedContact(contact);
    setContactDialogOpen(true);
  };

  const handleCloseContactDialog = () => {
    setContactDialogOpen(false);
  };

  const handleDeleteContact = (contact_id) => {
    setDeleteDialogOpen(true);
  };

  const confirmDeleteContact = async () => {
    // Add your delete logic here
    setDeleteDialogOpen(false);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
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

  return (
    <div>
      <TableContainer component={Paper} className="shadow-md sm:rounded-lg overflow-auto">
        <Table stickyHeader className="min-w-full">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>Mobile Number 1</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>Mobile Number 2</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>Address</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>Location</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contacts.map((contact) => (
              <TableRow key={contact.id} className="bg-white border-b">
                <TableCell>{contact.name}</TableCell>
                <TableCell>{contact.mobilenumber1}</TableCell>
                <TableCell>{contact.mobilenumber2}</TableCell>
                <TableCell>{contact.mailid}</TableCell>
                <TableCell>{contact.address}</TableCell>
                <TableCell>{contact.location}</TableCell>
                <TableCell>
                  <Tooltip title="Edit contact">
                    <IconButton onClick={() => handleOpenContactDialog(contact)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete contact">
                    <IconButton onClick={() => handleDeleteContact(contact.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={contactDialogOpen} onClose={handleCloseContactDialog} fullWidth maxWidth="sm">
        <DialogTitle>Edit Contact</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Name"
              variant="outlined"
              fullWidth
              margin="dense"
              value={selectedContact ? selectedContact.name : ''}
              onChange={(e) => setSelectedContact({ ...selectedContact, name: e.target.value })}
            />
            <TextField
              label="Mobile Number 1"
              variant="outlined"
              fullWidth
              margin="dense"
              value={selectedContact ? selectedContact.mobilenumber1 : ''}
              onChange={(e) => setSelectedContact({ ...selectedContact, mobilenumber1: e.target.value })}
            />
            <TextField
              label="Mobile Number 2"
              variant="outlined"
              fullWidth
              margin="dense"
              value={selectedContact ? selectedContact.mobilenumber2 : ''}
              onChange={(e) => setSelectedContact({ ...selectedContact, mobilenumber2: e.target.value })}
            />
            <TextField
              label="Email"
              variant="outlined"
              fullWidth
              margin="dense"
              value={selectedContact ? selectedContact.mailid : ''}
              onChange={(e) => setSelectedContact({ ...selectedContact, mailid: e.target.value })}
            />
            <TextField
              label="Address"
              variant="outlined"
              fullWidth
              margin="dense"
              value={selectedContact ? selectedContact.address : ''}
              onChange={(e) => setSelectedContact({ ...selectedContact, address: e.target.value })}
            />
            <TextField
              label="Location"
              variant="outlined"
              fullWidth
              margin="dense"
              value={selectedContact ? selectedContact.location : ''}
              onChange={(e) => setSelectedContact({ ...selectedContact, location: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseContactDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleCloseContactDialog} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} fullWidth maxWidth="sm">
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography>Are you sure you want to delete this contact?</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDeleteContact} color="primary">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default ContactTable;
