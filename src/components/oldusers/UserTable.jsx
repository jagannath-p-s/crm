import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import HistoryIcon from '@mui/icons-material/History';
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
  MenuItem,
  Select,
  Button,
  FormControl,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  TablePagination,
  Box,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

const UserTable = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [updatedUser, setUpdatedUser] = useState({});
  const [filterStage, setFilterStage] = useState('');
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  useEffect(() => {
    fetchUsers();
  }, [filterStage]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('user_details').select('*');
    if (error) {
      console.error('Error fetching users:', error);
    } else {
      setUsers(data);
      setStages([...new Set(data.map((user) => user.stage))]);
    }
    setLoading(false);
  };

  const handleSearch = (event) => setSearchTerm(event.target.value);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdatedUser({ ...updatedUser, [name]: value });
  };

  const saveUser = async () => {
    const { data, error } = await supabase
      .from('user_details')
      .update(updatedUser)
      .eq('id', editingUser);

    if (error) {
      console.error('Error updating user:', error);
    } else {
      fetchUsers();
      setEditingUser(null);
    }
  };

  const startEditUser = (user) => {
    setEditingUser(user.id);
    setUpdatedUser({ ...user });
  };

  const filteredUsers = users
    .filter((user) => (filterStage ? user.stage === filterStage : true))
    .filter((user) =>
      Object.values(user).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

  const handleChangePage = (event, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to the first page whenever rows per page changes
  };

  return (
    <Box className="bg-white rounded-lg shadow-md min-h-screen">
      <Box className="bg-white shadow-md">
        <Box className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Box className="flex justify-between items-center py-3">
            <Box className="flex items-center space-x-4">
              <HistoryIcon className="text-blue-500" style={{ fontSize: '1.75rem' }} />
              <h1 className="text-xl font-semibold ml-2">Previous Users</h1>
            </Box>
            <Box className="flex items-center space-x-4">
              <TextField
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={handleSearch}
                size="small"
                autoComplete="off"
              />
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <Select
                  value={filterStage}
                  displayEmpty
                  onChange={(e) => setFilterStage(e.target.value)}
                >
                  <MenuItem value="">See All</MenuItem>
                  {stages.map((stage, idx) => (
                    <MenuItem key={idx} value={stage}>
                      {stage}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Box>
      </Box>

      <div className="p-4 pt-0">
        <TableContainer
          component={Paper}
          className="shadow-md sm:rounded-lg overflow-auto"
          sx={{
            marginTop: '20px',
          }}
        >
          {loading ? (
            <Box style={{ margin: 'auto', display: 'block' }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>No</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Stage</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>First Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Second Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Contact Number</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Alternate Contact</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>User ID</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((user, index) => (
                      <TableRow key={user.id} hover>
                        <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                        <TableCell>{user.title}</TableCell>
                        <TableCell>{user.stage}</TableCell>
                        <TableCell>{user.first_name}</TableCell>
                        <TableCell>{user.second_name}</TableCell>
                        <TableCell>{user.contact_number}</TableCell>
                        <TableCell>{user.alternate_contact_number}</TableCell>
                        <TableCell>{user.user_id}</TableCell>
                        <TableCell>{user.description}</TableCell>
                        <TableCell>
                          <IconButton onClick={() => startEditUser(user)} color="primary" size="small">
                            <EditIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[25, 50, 100, 500]}
                component="div"
                count={filteredUsers.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </TableContainer>
      </div>

      <Dialog open={editingUser !== null} onClose={() => setEditingUser(null)} fullWidth>
  <DialogTitle>Edit User</DialogTitle>
  <DialogContent>
   
    {[
      { label: 'Title', name: 'title' },
      { label: 'Stage', name: 'stage' },
      { label: 'First Name', name: 'first_name' },
      { label: 'Second Name', name: 'second_name' },
      { label: 'Contact Number', name: 'contact_number' },
      { label: 'Alternate Contact', name: 'alternate_contact_number' },
      { label: 'User ID', name: 'user_id' },
      { label: 'Description', name: 'description' },
    ].map(({ label, name }) => (
      <TextField
        key={name}
        label={label}
        name={name}
        fullWidth
        value={updatedUser[name] || ''}
        onChange={handleInputChange}
        sx={{ marginBottom: 2 }} // Adds extra space between fields
      />
    ))}
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setEditingUser(null)}>Cancel</Button>
    <Button onClick={saveUser} color="primary">
      Save
    </Button>
  </DialogActions>
</Dialog>

    </Box>
  );
};

export default UserTable;
