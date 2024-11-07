import React, { useEffect, useState } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { supabase } from '../../supabaseClient';

const TechnicianEdits = ({ serviceEnquiryId }) => {
  const [edits, setEdits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEdits = async () => {
      try {
        const { data, error } = await supabase
          .from('technician_edits')
          .select('*')
          .eq('service_enquiry_id', serviceEnquiryId);

        if (error) throw error;
        setEdits(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEdits();
  }, [serviceEnquiryId]);

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">Error: {error}</Typography>;

  return (
    <Box mt={2}>
      <Typography variant="h6" gutterBottom>Technician Edits</Typography>
      {edits.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Old Technician Name</TableCell>
                <TableCell>New Technician Name</TableCell>
                <TableCell>Edit Timestamp</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {edits.map((edit) => (
                <TableRow key={edit.id}>
                  <TableCell>{edit.old_technician_name}</TableCell>
                  <TableCell>{edit.new_technician_name}</TableCell>
                  <TableCell>{new Date(edit.edit_timestamp).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography>No technician edits available.</Typography>
      )}
    </Box>
  );
};

export default TechnicianEdits;
