import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, List, ListItem, ListItemText
} from '@mui/material';
import { supabase } from '../../supabaseClient';

const TechnicianChangesDialog = ({ open, onClose, enquiry }) => {
  const [changes, setChanges] = useState([]);

  useEffect(() => {
    const fetchChanges = async () => {
      if (!enquiry) return;

      const { data, error } = await supabase
        .from('technician_changes')
        .select('*')
        .eq('service_id', enquiry.id);

      if (error) {
        console.error('Error fetching changes:', error);
        return;
      }

      setChanges(data);
    };

    fetchChanges();
  }, [enquiry]);

  const parseChanges = (change) => {
    try {
      const parsed = JSON.parse(change);
      const { oldTechnicians, newTechnicians, changedAt } = parsed;
      const added = newTechnicians.filter(tech => !oldTechnicians.includes(tech));
      const removed = oldTechnicians.filter(tech => !newTechnicians.includes(tech));

      return (
        <div>
          {added.length > 0 && (
            <Typography variant="body2">
              <strong>Added Technicians:</strong> {added.join(', ')}
            </Typography>
          )}
          {removed.length > 0 && (
            <Typography variant="body2">
              <strong>Removed Technicians:</strong> {removed.join(', ')}
            </Typography>
          )}
          <Typography variant="body2">
            <strong>Changed At:</strong> {new Date(changedAt).toLocaleString()}
          </Typography>
        </div>
      );
    } catch (error) {
      console.error('Error parsing changes:', error);
      return <Typography variant="body2" color="error">Invalid change data</Typography>;
    }
  };

  if (!enquiry) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Technician Changes for {enquiry.technician_name}</DialogTitle>
      <DialogContent>
        {changes.length > 0 ? (
          <List>
            {changes.map(change => (
              <ListItem key={change.id}>
                <ListItemText
                  primary={<Typography variant="body1">Changed on: {new Date(change.created_at).toLocaleString()}</Typography>}
                  secondary={parseChanges(change.changes)}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography>No changes found.</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TechnicianChangesDialog;
