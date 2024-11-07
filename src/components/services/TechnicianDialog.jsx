import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Tooltip, Box
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { supabase } from '../../supabaseClient';

const TechnicianDialog = ({ open, onClose }) => {
  const [technicians, setTechnicians] = useState([]);
  const [editingTechnician, setEditingTechnician] = useState(null);
  const [formValues, setFormValues] = useState({ name: '', employee_code: '' });
  const [openAddEditDialog, setOpenAddEditDialog] = useState(false);

  useEffect(() => {
    if (open) {
      fetchTechnicians();
    }
  }, [open]);

  const fetchTechnicians = async () => {
    try {
      const { data, error } = await supabase
        .from('technicians')
        .select('*')
        .order('name');
      if (error) throw error;
      setTechnicians(data);
    } catch (error) {
      console.error('Error fetching technicians:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const handleAddTechnician = async () => {
    try {
      const { error } = await supabase
        .from('technicians')
        .insert([formValues]);
      if (error) throw error;
      fetchTechnicians();
      handleCloseAddEditDialog();
    } catch (error) {
      console.error('Error adding technician:', error);
    }
  };

  const handleEditTechnician = (technician) => {
    setEditingTechnician(technician);
    setFormValues(technician);
    setOpenAddEditDialog(true);
  };

  const handleUpdateTechnician = async () => {
    try {
      const { error } = await supabase
        .from('technicians')
        .update(formValues)
        .eq('id', editingTechnician.id);
      if (error) throw error;
      fetchTechnicians();
      handleCloseAddEditDialog();
    } catch (error) {
      console.error('Error updating technician:', error);
    }
  };

  const handleDeleteTechnician = async (id) => {
    if (window.confirm('Are you sure you want to delete this technician?')) {
      try {
        const { error } = await supabase
          .from('technicians')
          .delete()
          .eq('id', id);
        if (error) throw error;
        fetchTechnicians();
      } catch (error) {
        console.error('Error deleting technician:', error);
      }
    }
  };

  const handleOpenAddEditDialog = () => {
    setEditingTechnician(null);
    setFormValues({ name: '', employee_code: '' });
    setOpenAddEditDialog(true);
  };

  const handleCloseAddEditDialog = () => {
    setEditingTechnician(null);
    setFormValues({ name: '', employee_code: '' });
    setOpenAddEditDialog(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          Manage Technicians
          <Tooltip title="Add Technician">
            <IconButton
              onClick={handleOpenAddEditDialog}
              style={{ backgroundColor: '#e3f2fd', color: '#1e88e5', borderRadius: '12px' }}
            >
              <AddIcon style={{ fontSize: '1.75rem' }} />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>
      <DialogContent>
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Employee Code</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {technicians.map((technician) => (
                <TableRow key={technician.id}>
                  <TableCell>{technician.name}</TableCell>
                  <TableCell>{technician.employee_code}</TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton onClick={() => handleEditTechnician(technician)} color="primary">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton onClick={() => handleDeleteTechnician(technician.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>

      <Dialog open={openAddEditDialog} onClose={handleCloseAddEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTechnician ? 'Edit Technician' : 'Add Technician'}</DialogTitle>
        <DialogContent>
          <TextField
            name="name"
            label="Technician Name"
            value={formValues.name}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
          />
          <TextField
            name="employee_code"
            label="Employee Code"
            value={formValues.employee_code}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddEditDialog} color="primary">
            Cancel
          </Button>
          <Button
            onClick={editingTechnician ? handleUpdateTechnician : handleAddTechnician}
            color="primary"
          >
            {editingTechnician ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default TechnicianDialog;
