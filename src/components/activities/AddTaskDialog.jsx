import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
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
  Box,
  Snackbar,
  Alert,
  Typography,
  Grid,
  CircularProgress
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';

const AddTaskDialog = ({ open, handleClose, enquiryId, assignedBy, userRole }) => {
  const [taskName, setTaskName] = useState('');
  const [taskMessage, setTaskMessage] = useState('');
  const [assignedTo, setAssignedTo] = useState(userRole === 'Admin' || userRole === 'Manager' ? '' : assignedBy); // Default to current user for non-admins
  const [users, setUsers] = useState([]);
  const [dueDate, setDueDate] = useState(dayjs().add(7, 'day')); // Default to 7 days from now
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('id, username, employee_code');

      if (error) {
        console.error('Error fetching users:', error);
        setSnackbar({ open: true, message: 'Failed to fetch users', severity: 'error' });
      } else {
        setUsers(data);
      }
      setLoading(false);
    };

    if (userRole === 'Admin' || userRole === 'Manager') {
      fetchUsers();
    }
  }, [userRole]);

  const validateForm = () => {
    const newErrors = {};
    if (!taskName.trim()) newErrors.taskName = 'Task name is required';
    if (!assignedTo) newErrors.assignedTo = 'Please assign the task to a user';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Insert the task
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .insert({
          task_name: taskName,
          task_message: taskMessage,
          enquiry_id: enquiryId || null, // Only include enquiryId if not null
          type: 'product',
          assigned_by: assignedBy,
          assigned_to: assignedTo,
          submission_date: dueDate.toISOString()
        });

      if (taskError) throw taskError;

      if (enquiryId) {
        // Fetch the enquiry details if enquiryId exists
        const { data: enquiryData, error: enquiryFetchError } = await supabase
          .from('enquiries')
          .select('salesflow_code, assignedto')
          .eq('id', enquiryId)
          .single();

        if (enquiryFetchError) throw enquiryFetchError;

        let participants = enquiryData.salesflow_code ? enquiryData.salesflow_code.split('-') : [];
        const previousUser = enquiryData.assignedto;

        if (previousUser) {
          const { data: pointsData, error: pointsCheckError } = await supabase
            .from('salesman_points')
            .select('*')
            .eq('user_id', previousUser)
            .eq('enquiry_id', enquiryId);

          if (pointsCheckError) throw pointsCheckError;

          if (pointsData.length === 0) {
            await supabase
              .from('salesman_points')
              .insert({
                user_id: previousUser,
                points: 1,
                enquiry_id: enquiryId
              });
          }
        }

        if (!participants.includes(assignedTo.toString())) {
          participants.push(assignedTo);
        }

        const salesflow_code = participants.join('-');

        await supabase
          .from('enquiries')
          .update({ salesflow_code, assignedto: assignedTo })
          .eq('id', enquiryId);
      }

      setSnackbar({ open: true, message: 'Task added successfully', severity: 'success' });
      handleClose();
    } catch (error) {
      console.error('Error adding task or updating enquiry:', error);
      setSnackbar({
        open: true,
        message: `Failed to add task or update enquiry: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ open: false, message: '', severity: 'info' });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" component="div" gutterBottom>
            Add New Task
          </Typography>
        </DialogTitle>
        <DialogContent>
         <div className='mt-2'>
         <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                label="Task Name"
                type="text"
                fullWidth
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                variant="outlined"
                error={!!errors.taskName}
                helperText={errors.taskName}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Task Message"
                type="text"
                fullWidth
                multiline
                rows={3}
                value={taskMessage}
                onChange={(e) => setTaskMessage(e.target.value)}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth variant="outlined" error={!!errors.assignedTo} required>
                <InputLabel>Assign To</InputLabel>
                <Select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  label="Assign To"
                  disabled={!(userRole === 'Admin' || userRole === 'Manager')} // Disable for non-admins and non-managers
                >
                  <MenuItem value="">Select a user</MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.username} ({user.employee_code})
                    </MenuItem>
                  ))}
                </Select>
                {errors.assignedTo && <Typography color="error">{errors.assignedTo}</Typography>}
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <DateTimePicker
                label="Due Date"
                value={dueDate}
                onChange={(newValue) => setDueDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
          </Grid>
         </div>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} variant="outlined" disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Adding Task...' : 'Add Task'}
          </Button>
        </DialogActions>
      </Dialog>
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
    </LocalizationProvider>
  );
};

export default AddTaskDialog;