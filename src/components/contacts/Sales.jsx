import React, { useState, useEffect, useCallback } from 'react';
import Tooltip from '@mui/material/Tooltip';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import ViewListIcon from '@mui/icons-material/ViewList';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import Column from './Column';
import FilterSelect from './FilterSelect';
import DialogContentText from '@mui/material/DialogContentText';
import TableView from './TableView';
import { supabase } from '../../supabaseClient';
import { DragDropContext } from 'react-beautiful-dnd';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import PrintBillDialog from './PrintBillDialog';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import dayjs from 'dayjs';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';

const dateOptions = ['See All', 'This Month', 'Last 30 Days', 'Last 60 Days', 'Custom Date Range'];

const Sales = () => {
  const initialExpandedColumns = ['Lead', 'Prospect', 'Opportunity', 'Customer-Won', 'Lost/Rejected'];
  const [expanded, setExpanded] = useState(initialExpandedColumns);
  const [view, setView] = useState('cards');
  const [columns, setColumns] = useState([]);
  const [users, setUsers] = useState({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [visibleFields, setVisibleFields] = useState({
    name: true,
    mobilenumber1: true,
    mobilenumber2: false,
    address: false,
    location: false,
    stage: false,
    dbt_userid_password: false,
    leadsource: false,
    assignedto: false,
    remarks: false,
    invoiced: true,
    collected: false,
    products: true,
    created_at: true,
    salesflow_code: true,
    last_updated: true,
    state: false,
    district: false,
    expected_completion_date: false,
    subsidy: false,
    dbt_c_o: false,
    contacttype: false,
  });
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [dragResult, setDragResult] = useState(null);
  const [viewCompletedSales, setViewCompletedSales] = useState(false);
  const [dateFilter, setDateFilter] = useState('Last 30 Days');
  const [startDate, setStartDate] = useState(dayjs().subtract(30, 'day'));
  const [endDate, setEndDate] = useState(dayjs());
  const [pipelines, setPipelines] = useState([]);
  const [stages, setStages] = useState([]);
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [selectedStage, setSelectedStage] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // New states for user selection
  const [selectedUser, setSelectedUser] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchPipelines();
    fetchUsers();
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (selectedPipeline) {
      fetchStages(selectedPipeline);
    } else {
      setStages([]); // Reset stages if no pipeline is selected
    }
  }, [selectedPipeline]);

  useEffect(() => {
    fetchData();
  }, [selectedPipeline, selectedStage, viewCompletedSales, dateFilter, startDate, endDate, selectedUser]);

  const fetchCurrentUser = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error fetching current user:', error);
    } else if (data.user) {
      // Assuming the user ID is stored in data.user.id and matches users.id
      setCurrentUser(data.user);
      setSelectedUser(data.user.id); // Default to current user
    }
  };

  const fetchUsers = async () => {
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, username, employee_code');
    if (usersError) {
      console.error('Error fetching users:', usersError);
    } else {
      const usersMap = usersData.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {});
      setUsers(usersMap);
    }
  };

  const fetchPipelines = async () => {
    const { data: pipelineData, error } = await supabase.from('pipelines').select('*');
    if (error) {
      console.error('Error fetching pipelines:', error);
    } else {
      setPipelines(pipelineData);
    }
  };

  const fetchStages = async (pipelineId) => {
    const { data: stageData, error } = await supabase
      .from('pipeline_stages')
      .select('*')
      .eq('pipeline_id', pipelineId);
    if (error) {
      console.error('Error fetching stages:', error);
    } else {
      setStages(stageData);
    }
  };

  const fetchData = useCallback(async () => {
    let query = supabase.from('enquiries').select('*');

    if (selectedPipeline) {
      query = query.eq('pipeline_id', selectedPipeline);
    }

    if (selectedStage) {
      query = query.eq('current_stage_id', selectedStage);
    }

    if (viewCompletedSales) {
      query = query.eq('stage', 'Customer-Won');
    }

    if (selectedUser) {
      query = query.eq('assignedto', selectedUser); // Corrected field name
    }

    if (dateFilter === 'This Month') {
      query = query.gte('created_at', dayjs().startOf('month').toISOString());
    } else if (dateFilter === 'Last 30 Days') {
      query = query.gte('created_at', dayjs().subtract(30, 'day').toISOString());
    } else if (dateFilter === 'Last 60 Days') {
      query = query.gte('created_at', dayjs().subtract(60, 'day').toISOString());
    } else if (dateFilter === 'Custom Date Range') {
      query = query.gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString());
    }

    const { data: enquiries, error: enquiriesError } = await query;

    if (enquiriesError) {
      console.error('Error fetching enquiries:', enquiriesError);
      return;
    }

    // Categorize enquiries
    const categorizedData = [
      { name: 'Lead', color: 'purple', bgColor: 'bg-purple-50', contacts: [] },
      { name: 'Prospect', color: 'blue', bgColor: 'bg-blue-50', contacts: [] },
      { name: 'Opportunity', color: 'indigo', bgColor: 'bg-indigo-50', contacts: [] },
      { name: 'Customer-Won', color: 'green', bgColor: 'bg-green-50', contacts: [] },
      { name: 'Lost/Rejected', color: 'red', bgColor: 'bg-red-50', contacts: [] },
    ];

    enquiries.forEach((contact) => {
      const category = categorizedData.find((c) => c.name === contact.stage);
      if (category) {
        category.contacts.push(contact);
      }
    });

    setColumns(categorizedData);
  }, [selectedPipeline, selectedStage, viewCompletedSales, dateFilter, startDate, endDate, selectedUser]);

  const handlePipelineSelect = (pipelineId) => {
    setSelectedPipeline(pipelineId);
    setSelectedStage(null);
  };

  const handleStageSelect = (stageId) => {
    setSelectedStage(stageId);
    setAnchorEl(null);
  };

  const handleFilterIconClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const sourceColumn = columns.find((column) => column.name === source.droppableId);
    const destinationColumn = columns.find((column) => column.name === destination.droppableId);

    if (sourceColumn.name === 'Customer-Won' && destinationColumn.name !== 'Customer-Won') {
      return;
    }

    const sourceItems = Array.from(sourceColumn.contacts);
    const [movedItem] = sourceItems.splice(source.index, 1);
    const destinationItems = Array.from(destinationColumn.contacts);
    destinationItems.splice(destination.index, 0, movedItem);

    movedItem.stage = destination.droppableId;

    setColumns(
      columns.map((column) => {
        if (column.name === source.droppableId) {
          return { ...column, contacts: sourceItems };
        } else if (column.name === destination.droppableId) {
          return { ...column, contacts: destinationItems };
        }
        return column;
      })
    );

    if (destination.droppableId === 'Customer-Won') {
      setCustomerDetails(movedItem);
      setPrintDialogOpen(true);
      setDragResult(result);
    } else {
      const updatedStage = stages.find(stage => stage.stage_name === destination.droppableId);
      if (!updatedStage) {
        console.error('Stage not found:', destination.droppableId);
        return;
      }

      const { error } = await supabase
        .from('enquiries')
        .update({ 
          stage: destination.droppableId,
          current_stage_id: updatedStage.stage_id
        })
        .eq('id', movedItem.id);
      if (error) {
        console.error('Error updating stage:', error);
      } else {
        fetchData();
      }
    }
  };

  const handleSettingsOpen = () => {
    setSettingsOpen(true);
  };

  const handleSettingsClose = () => {
    setSettingsOpen(false);
  };

  const handleFieldChange = (event) => {
    setVisibleFields({ ...visibleFields, [event.target.name]: event.target.checked });
  };

  const handleDateFilterChange = (value) => {
    setDateFilter(value);
  };

  const handleStartDateChange = (date) => {
    setStartDate(date);
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
  };

  const handleFormSubmit = async (updatedEnquiry) => {
    try {
      const { error } = await supabase.from('enquiries').update(updatedEnquiry).eq('id', updatedEnquiry.id);

      if (error) throw error;

      setColumns((prevColumns) => {
        return prevColumns.map((column) => {
          if (column.name === updatedEnquiry.stage) {
            const updatedContacts = column.contacts.map((contact) =>
              contact.id === updatedEnquiry.id ? updatedEnquiry : contact
            );
            return { ...column, contacts: updatedContacts };
          }
          return column;
        });
      });

      setSnackbar({
        open: true,
        message: 'Enquiry updated successfully!',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error updating enquiry:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update enquiry',
        severity: 'error',
      });
    }
  };

  const handlePrintClose = async (shouldMove) => {
    setPrintDialogOpen(false);
    if (shouldMove && dragResult) {
      const { destination } = dragResult;
      const movedItem = customerDetails;

      const updatedStage = stages.find(stage => stage.stage_name === destination.droppableId);
      if (!updatedStage) {
        console.error('Stage not found:', destination.droppableId);
        return;
      }

      const { error } = await supabase
        .from('enquiries')
        .update({ 
          stage: destination.droppableId,
          current_stage_id: updatedStage.stage_id,
          won_date: new Date().toISOString()
        })
        .eq('id', movedItem.id);

      if (error) {
        console.error('Error updating stage:', error);
      } else {
        fetchData();
      }
    }
    setDragResult(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <ShoppingBagOutlinedIcon className="text-blue-500" style={{ fontSize: '1.75rem' }} />
                <h1 className="text-xl font-semibold ml-2 mr-2">Sales</h1>
                <FilterSelect
                  label="Date Range"
                  value={dateFilter}
                  handleChange={handleDateFilterChange}
                  options={dateOptions}
                  withDatePicker={dateFilter === 'Custom Date Range'}
                  startDate={startDate}
                  endDate={endDate}
                  handleStartDateChange={handleStartDateChange}
                  handleEndDateChange={handleEndDateChange}
                />
                {/* User Selection Dropdown */}
                <FormControl variant="outlined" size="small" style={{ minWidth: 180, marginLeft: 16 }}>
                  <InputLabel id="assigned-user-label">Assigned To</InputLabel>
                  <Select
                    labelId="assigned-user-label"
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    label="Assigned To"
                  >
                    <MenuItem value={currentUser ? currentUser.id : ''}>
                      My Sales
                    </MenuItem>
                    <MenuItem value="">All Users</MenuItem>
                    {Object.values(users).map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.username} {user.employee_code ? `(${user.employee_code})` : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Tooltip title="Filter Pipelines">
                <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full" onClick={handleFilterIconClick}>
                  <FilterAltOutlinedIcon style={{ fontSize: '1.75rem' }} />
                </button>
              </Tooltip>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
              >
                {/* Pipelines Section */}
                <MenuItem onClick={() => { setSelectedPipeline(null); setSelectedStage(null); handleMenuClose(); }}>
                  <ListItemText primary="All Pipelines" />
                </MenuItem>
                {pipelines.map((pipeline) => (
                  <MenuItem
                    key={pipeline.pipeline_id}
                    onClick={() => handlePipelineSelect(pipeline.pipeline_id)}
                  >
                    <ListItemText primary={pipeline.pipeline_name} />
                    {selectedPipeline === pipeline.pipeline_id && (
                      <ArrowRightIcon />
                    )}
                  </MenuItem>
                ))}

                <Divider /> {/* Divider to separate pipelines from stages */}

                {/* Stages Section */}
                <MenuItem onClick={() => handleStageSelect(null)}>
                  <ListItemText primary="All Stages" />
                </MenuItem>
                {selectedPipeline && stages.map((stage) => (
                  <MenuItem
                    key={stage.stage_id}
                    onClick={() => handleStageSelect(stage.stage_id)}
                    style={{ paddingLeft: '32px' }} // Indent to show it's related to the pipeline
                  >
                    <ListItemText primary={stage.stage_name} />
                  </MenuItem>
                ))}
              </Menu>

              <Tooltip title="Settings">
                <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full" onClick={handleSettingsOpen}>
                  <SettingsOutlinedIcon style={{ fontSize: '1.75rem' }} />
                </button>
              </Tooltip>
              <Tooltip title={view === 'cards' ? 'Table View' : 'Card View'}>
                <button
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                  onClick={() => setView(view === 'cards' ? 'table' : 'cards')}
                >
                  {view === 'cards' ? <TableChartOutlinedIcon style={{ fontSize: '1.75rem' }} /> : <ViewListIcon style={{ fontSize: '1.75rem' }} />}
                </button>
              </Tooltip>
              {/* Uncomment if you want to enable viewing completed sales
              <Tooltip title="View Completed Sales">
                <button
                  className={`flex items-center p-2 rounded-full ${viewCompletedSales ? 'text-blue-500 bg-blue-100' : 'text-gray-500 hover:bg-gray-100'}`}
                  onClick={() => setViewCompletedSales(!viewCompletedSales)}
                >
                  <CheckCircleOutlineIcon style={{ fontSize: '1.75rem' }} />
                </button>
              </Tooltip>
              */}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={settingsOpen} onClose={handleSettingsClose}>
        <DialogTitle>Customize Contact Card Fields</DialogTitle>
        <DialogContent>
          <DialogContentText>Select which fields to display in the contact card.</DialogContentText>
          {Object.keys(visibleFields).map((field) => (
            <FormControlLabel
              key={field}
              control={<Checkbox checked={visibleFields[field]} onChange={handleFieldChange} name={field} />}
              label={field.charAt(0).toUpperCase() + field.slice(1)}
            />
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSettingsClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <PrintBillDialog
        open={printDialogOpen}
        handleClose={handlePrintClose}
        customer={customerDetails}
        onCustomerUpdate={fetchData}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {viewCompletedSales ? (
        <div>Completed Sales View</div> // Replace with actual completed sales component
      ) : (
        <div className="flex flex-grow p-4 space-x-4 overflow-x-auto">
          <DragDropContext onDragEnd={onDragEnd}>
            {view === 'cards' ? (
              columns.map((column) => (
                <Column
                  key={column.name}
                  column={column}
                  users={users}
                  visibleFields={visibleFields}
                  onCardUpdate={handleFormSubmit}
                />
              ))
            ) : (
              <TableView columns={columns} users={users} visibleFields={visibleFields} />
            )}
          </DragDropContext>
        </div>
      )}
    </div>
  );
};

export default Sales;
