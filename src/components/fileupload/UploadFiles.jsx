import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import {
  TextField,
  IconButton,
  Tooltip,

  Menu,
  MenuItem,
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
  ListItemIcon,
  ListItemText,
  Snackbar,
  Alert,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  TablePagination, // Import TablePagination
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  CloudUpload as CloudUploadIcon,
  Add as AddIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Description as FileIcon,
  Edit as EditIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Upload as UploadIcon ,
} from '@mui/icons-material';

const UploadFiles = () => {
  const [files, setFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileName, setFileName] = useState('');
  const [accessControl, setAccessControl] = useState({
    manager_access: false,
    salesperson_access: false,
    service_access: false,
    accounts_access: false,
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [fileDialogOpen, setFileDialogOpen] = useState(false);
  const [selectedFileUrl, setSelectedFileUrl] = useState('');
  const [unsupportedFile, setUnsupportedFile] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [sortField, setSortField] = useState('file_size');
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState(null);
  const [page, setPage] = useState(0); // State for the current page
  const [rowsPerPage, setRowsPerPage] = useState(50); // State for rows per page

  useEffect(() => {
    fetchUserRole();
  }, []);

  useEffect(() => {
    if (userRole && userId !== null) {
      fetchFiles();
    }
  }, [sortOrder, sortField, userRole, userId]);

  const fetchUserRole = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserRole(user.role);
      setUserId(user.id);
    }
  };

  const fetchFiles = async () => {
    if (!userId) {
      return;
    }

    let query = supabase
      .from('uploaded_files')
      .select('*, users!inner(username)')
      .order(sortField, { ascending: sortOrder === 'asc' });

    if (userRole !== 'Admin') {
      query = query.or(`uploaded_by.eq.${userId},admin_access.eq.true,manager_access.eq.true,salesperson_access.eq.true,service_access.eq.true,accounts_access.eq.true`);
    }

    const { data, error } = await query;

    if (error) {
      showSnackbar(`Error fetching files: ${error.message}`, 'error');
    } else {
      setFiles(data);
    }
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleMenuOpen = (event, file) => {
    setAnchorEl(event.currentTarget);
    setSelectedFile(file);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedFile(null);
  };

  const handleDownload = async () => {
    const { data, error } = await supabase.storage.from('files').download(selectedFile.file_path);
    if (error) {
      showSnackbar(`Error downloading file: ${error.message}`, 'error');
    } else {
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = selectedFile.file_name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showSnackbar('File downloaded', 'success');
    }
    handleMenuClose();
  };

  const handleDelete = async () => {
    try {
      const { error: storageError } = await supabase.storage
        .from('files')
        .remove([selectedFile.file_path]);

      if (storageError) {
        showSnackbar(`Error deleting file from storage: ${storageError.message}`, 'error');
        return;
      }

      const { error: dbError } = await supabase
        .from('uploaded_files')
        .delete()
        .eq('file_id', selectedFile.file_id);

      if (dbError) {
        showSnackbar(`Error deleting file from database: ${dbError.message}`, 'error');
        return;
      }

      showSnackbar('File deleted successfully', 'success');
      fetchFiles();
      handleMenuClose();
    } catch (error) {
      showSnackbar(`Unexpected error: ${error.message}`, 'error');
    }
  };

  const handleOpenUploadDialog = () => {
    setUploadDialogOpen(true);
    setDefaultAccessControl();
  };

  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
    setSelectedFiles([]);
    setFileName('');
    setAccessControl({
      manager_access: false,
      salesperson_access: false,
      service_access: false,
      accounts_access: false,
    });
  };

  const handleFileChange = (event) => {
    const selected = Array.from(event.target.files).map((file) => {
        const preview = file.type.startsWith('image/')
            ? URL.createObjectURL(file) // Preview URL for images
            : null;
        return { file, preview };
    });
    setSelectedFiles(selected);
};

  const handleFileNameChange = (event) => {
    setFileName(event.target.value);
  };

  const handleFileUpload = async () => {
    if (!fileName || selectedFiles.length === 0) {
      showSnackbar('Please provide a file name and select at least one file.', 'error');
      return;
    }

    const user = JSON.parse(localStorage.getItem('user'));

    if (!user) {
      showSnackbar('User not authenticated', 'error');
      return;
    }

    for (const file of selectedFiles) {
      try {
        const uniqueFileName = `${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('files')
          .upload(uniqueFileName, file);

        if (uploadError) {
          showSnackbar(`Error uploading file: ${uploadError.message}`, 'error');
          continue;
        }

        const { error: insertError } = await supabase.from('uploaded_files').insert([
          {
            file_name: fileName || file.name,
            file_path: uniqueFileName,
            uploaded_by: user.id,
            ...accessControl,
            file_size: file.size,
            file_type: file.type,
          },
        ]);

        if (insertError) {
          showSnackbar(`Error saving file metadata: ${insertError.message}`, 'error');
        } else {
          showSnackbar('File uploaded successfully', 'success');
          fetchFiles();
        }
      } catch (error) {
        showSnackbar(`Unexpected error: ${error.message}`, 'error');
      }
    }

    handleCloseUploadDialog();
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

  const handleFilePreview = async (filePath) => {
    const { data, error } = await supabase.storage.from('files').download(filePath);
    if (error) {
      showSnackbar(`Error fetching file: ${error.message}`, 'error');
    } else {
      const url = URL.createObjectURL(data);
      const fileType = data.type;
      setUnsupportedFile(false);

      if (fileType === 'application/pdf') {
        setUnsupportedFile(true);
        setSelectedFileUrl('');
      } else if (fileType.startsWith('image/')) {
        setSelectedFileUrl(url);
      } else {
        setUnsupportedFile(true);
        setSelectedFileUrl('');
      }
      setFileDialogOpen(true);
    }
  };

  const handleCloseFileDialog = () => {
    setFileDialogOpen(false);
    setSelectedFileUrl('');
  };

  const handleEdit = () => {
    setNewFileName(selectedFile.file_name);
    setEditDialogOpen(true);
  };

  const handleEditFileNameChange = (event) => {
    setNewFileName(event.target.value);
  };

  const handleRemoveFile = (index) => {
    const updatedFiles = [...selectedFiles];
    updatedFiles.splice(index, 1);
    setSelectedFiles(updatedFiles);
  };
  


  const handleSaveEdit = async () => {
    const { error } = await supabase
      .from('uploaded_files')
      .update({ file_name: newFileName })
      .eq('file_id', selectedFile.file_id);

    if (error) {
      showSnackbar(`Error updating file name: ${error.message}`, 'error');
    } else {
      showSnackbar('File name updated successfully', 'success');
      fetchFiles();
    }

    setEditDialogOpen(false);
    handleMenuClose();
  };

  const getFileIcon = (filePath) => {
    const extension = filePath.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
      return <ImageIcon />;
    } else if (extension === 'pdf') {
      return <PdfIcon />;
    } else {
      return <FileIcon />;
    }
  };

  const handleSortToggle = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  const formatFileSize = (size) => {
    if (size >= 1073741824) {
      return (size / 1073741824).toFixed(2) + ' GB';
    } else if (size >= 1048576) {
      return (size / 1048576).toFixed(2) + ' MB';
    } else {
      return (size / 1024).toFixed(2) + ' KB';
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredFiles = files.filter((file) =>
    file.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.users.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    new Date(file.upload_date).toLocaleDateString().toLowerCase().includes(searchTerm.toLowerCase()) ||
    formatFileSize(file.file_size).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedFiles = filteredFiles.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white shadow-md ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-4">
              <CloudUploadIcon className="text-blue-500" style={{ fontSize: '1.75rem' }} />
              <h1 className="text-xl font-semibold ml-2">Upload Files</h1>
            </div>
            <div className="flex items-center space-x-4">
              <TextField
                type="text"
                placeholder="Search for files"
                value={searchTerm}
                onChange={handleSearch}
                variant="outlined"
                size="small"
                sx={{ pl: 1, pr: 1, py: 1, borderRadius: 2 }}
                autoComplete="off"
              />
              <Tooltip title="Add new file">
                <IconButton
                  className="p-2"
                  onClick={handleOpenUploadDialog}
                  style={{ backgroundColor: '#e3f2fd', color: '#1e88e5', borderRadius: '12px' }}
                >
                  <AddIcon style={{ fontSize: '1.75rem' }} />
                </IconButton>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow p-4 space-x-4 overflow-x-auto">
      <TableContainer
  component={Paper}
  className="shadow-md sm:rounded-lg overflow-auto"
  sx={{
    marginTop: '0px', 
    marginBottom: '0px', 
    paddingTop: '0px', 
    paddingBottom: '0px', 
  }}
>
  <Table stickyHeader className="min-w-full">
    <TableHead>
      <TableRow>
        <TableCell sx={{ fontWeight: 'bold', color: 'black', textAlign: 'center', padding: '8px' }}>No</TableCell>
        <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>File Name</TableCell>
        <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>
          Uploaded Date
          <IconButton onClick={() => handleSortToggle('upload_date')}>
            {sortOrder === 'asc' && sortField === 'upload_date' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>Uploaded By</TableCell>
        <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>
          File Size
          <IconButton onClick={() => handleSortToggle('file_size')}>
            {sortOrder === 'asc' && sortField === 'file_size' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>Preview</TableCell>
        <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>Actions</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {paginatedFiles.map((file, index) => (
        <TableRow key={file.file_id} className="bg-white border-b">
          <TableCell sx={{ textAlign: 'center', padding: '8px' }}>{page * rowsPerPage + index + 1}</TableCell>
          <TableCell>{file.file_name}</TableCell>
          <TableCell>{new Date(file.upload_date).toLocaleDateString()}</TableCell>
          <TableCell>{file.users.username}</TableCell>
          <TableCell>{formatFileSize(file.file_size)}</TableCell>
          <TableCell>
            <Tooltip title="Preview file">
              <IconButton onClick={() => handleFilePreview(file.file_path)}>
                {getFileIcon(file.file_path)}
              </IconButton>
            </Tooltip>
          </TableCell>
          <TableCell>
            <IconButton onClick={(event) => handleMenuOpen(event, file)}>
              <MoreVertIcon />
            </IconButton>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>

        <TablePagination
          rowsPerPageOptions={[50, 100, 150]}
          component="div"
          count={filteredFiles.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </div>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleDownload} sx={{ padding: '12px 20px' }}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" sx={{ fontSize: '20px' }} />
          </ListItemIcon>
          <ListItemText primary="Download file" />
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ padding: '12px 20px' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ fontSize: '20px' }} />
          </ListItemIcon>
          <ListItemText primary="Delete file" />
        </MenuItem>
        <MenuItem onClick={handleEdit} sx={{ padding: '12px 20px' }}>
          <ListItemIcon>
            <EditIcon fontSize="small" sx={{ fontSize: '20px' }} />
          </ListItemIcon>
          <ListItemText primary="Edit file name" />
        </MenuItem>
      </Menu>

      <Dialog open={uploadDialogOpen} onClose={handleCloseUploadDialog} className="rounded-lg shadow-xl">
  <DialogTitle className="text-lg font-semibold p-4">Upload Files</DialogTitle>
  <DialogContent className="p-6 space-y-4">
    <TextField
      label="File Name"
      variant="outlined"
      fullWidth
      margin="dense"
      value={fileName}
      onChange={handleFileNameChange}
      className="mb-4"
    />

    <div className="border-2 border-dashed border-gray-300 rounded-md p-4 bg-white text-center relative">
      <input
        id="fileUpload"
        type="file"
        multiple
        onChange={handleFileChange}
        className="opacity-0 absolute top-0 left-0 w-full h-full cursor-pointer"
      />
    
      {/* Conditionally render the drag-and-drop message */}
      {!selectedFiles.length && (
        <p className="mt-2 text-sm text-gray-500">Drag and drop file here or click to upload</p>
      )}

      {/* File Previews */}
      <div className="space-y-2">
        {selectedFiles.map((fileObj, index) => (
          <div key={index} className="flex items-center space-x-4">
            {fileObj.preview ? (
              <img
                src={fileObj.preview}
                alt="file preview"
                className="h-12 w-12 object-cover rounded-md"
              />
            ) : (
              <FileIcon className="h-12 w-12 text-gray-500" />
            )}
            <Typography className="font-semibold">{fileObj.file.name}</Typography>
            <IconButton onClick={() => handleRemoveFile(index)}>
              <DeleteIcon className="text-red-500" />
            </IconButton>
          </div>
        ))}
      </div>
    </div>

    <div className="bg-gray-50 p-4 rounded-md shadow-sm">
      <FormGroup className="space-y-2">
        <FormControlLabel
          control={
            <Checkbox
              checked={accessControl.manager_access}
              onChange={(event) =>
                setAccessControl({ ...accessControl, manager_access: event.target.checked })
              }
            />
          }
          label="Manager Access"
          className="text-gray-700"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={accessControl.salesperson_access}
              onChange={(event) =>
                setAccessControl({ ...accessControl, salesperson_access: event.target.checked })
              }
            />
          }
          label="Salesperson Access"
          className="text-gray-700"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={accessControl.service_access}
              onChange={(event) =>
                setAccessControl({ ...accessControl, service_access: event.target.checked })
              }
            />
          }
          label="Service Access"
          className="text-gray-700"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={accessControl.accounts_access}
              onChange={(event) =>
                setAccessControl({ ...accessControl, accounts_access: event.target.checked })
              }
            />
          }
          label="Accounts Access"
          className="text-gray-700"
        />
      </FormGroup>
    </div>
  </DialogContent>

  <DialogActions className="p-4">
    <Button onClick={handleCloseUploadDialog} className="text-gray-600 hover:text-gray-800">
      Cancel
    </Button>
    <Button onClick={handleFileUpload} className="bg-gray-200 text-gray-800 hover:bg-gray-300 rounded-md px-4 py-2 ml-4">
      Upload
    </Button>
  </DialogActions>
</Dialog>





      <Dialog open={fileDialogOpen} onClose={handleCloseFileDialog} maxWidth="sm" fullWidth>
        <DialogTitle>File Preview</DialogTitle>
        <DialogContent>
          {unsupportedFile ? (
            <Typography variant="body1">
              Unsupported file type for preview. Download it to view.
            </Typography>
          ) : selectedFileUrl ? (
            <img src={selectedFileUrl} alt="Preview" style={{ width: '100%', maxHeight: '600px', objectFit: 'contain' }} />
          ) : (
            <Typography variant="body1">
              Unsupported file type for preview. Download it to view.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFileDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit File Name</DialogTitle>
        <DialogContent>
          <TextField
            label="New File Name"
            variant="outlined"
            fullWidth
            margin="dense"
            value={newFileName}
            onChange={handleEditFileNameChange}
            className="mt-2 mb-4"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSaveEdit} color="primary">
            Save
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
    </div>
  );
};

export default UploadFiles;
