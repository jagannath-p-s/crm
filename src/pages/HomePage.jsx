import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Menu as MenuIcon,
  NotificationsNone as NotificationsNoneIcon,
  Add as AddIcon,
  PeopleOutline as PeopleOutlineIcon,
  CloudUploadOutlined as CloudUploadOutlinedIcon,
  EventNote as EventNoteIcon,
  Equalizer as EqualizerIcon,
  SettingsOutlined as SettingsOutlinedIcon,
  ExitToApp as ExitToAppIcon,
  ShoppingBagOutlined as ShoppingBagOutlinedIcon,
  Build as BuildIcon,
  Storage as StorageIcon,
  Business as BusinessIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import HistoryIcon from '@mui/icons-material/History';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import { Tooltip, Menu, MenuItem, Snackbar, Alert, Badge, CircularProgress } from '@mui/material';
import Contacts from '../components/contacts/Contacts';
import Sales from '../components/contacts/Sales';
import Activities from '../components/activities/Activities';
import Dashboard from '../components/dashboard/Dashboard';
import Services from '../components/services/Services';
import Stock from '../components/stock/Stock';
import UploadFiles from '../components/fileupload/UploadFiles';
import Organisation from '../components/organization/Organisation';
import SearchComponent from '../components/search/SearchComponent';
import SearchBar from '../components/search/SearchBar';
import BatchComponent from '../components/batches/BatchComponent';
import Pipelines from '../components/pipelines/Pipelines';
import UserTable from '../components/oldusers/UserTable';
import { supabase } from '../supabaseClient';

const HomePage = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [addMenuAnchorEl, setAddMenuAnchorEl] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeComponent, setActiveComponent] = useState('Activities'); // Default to 'Activities'
  const [previousComponent, setPreviousComponent] = useState('Activities'); // Default to 'Activities'
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessages, setNewMessages] = useState(false);
  const sidebarRef = useRef(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    console.log('Stored user:', storedUser); // Debug log
    if (storedUser && storedUser.expiry > Date.now()) {
      setUser(storedUser);
      fetchUserPermissions(storedUser.id);
    } else {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    setLoading(false);
  }, []);

  const fetchUserPermissions = async (userId) => {
    if (!userId) {
      console.error('Invalid userId:', userId); // Debug log
      showSnackbar(`Error fetching user permissions: Invalid userId`, 'error');
      return;
    }
    try {
      const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
      if (error) throw error;
      setUser((prevUser) => ({ ...prevUser, ...data }));
      localStorage.setItem('user', JSON.stringify({ ...user, ...data }));
    } catch (error) {
      showSnackbar(`Error fetching user permissions: ${error.message}`, 'error');
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAddMenuOpen = (event) => {
    setAddMenuAnchorEl(event.currentTarget);
  };

  const handleAddMenuClose = () => {
    setAddMenuAnchorEl(null);
  };

  const handleToggle = () => {
    setIsExpanded((prev) => !prev);
  };

  const handleClickOutside = useCallback((event) => {
    if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
      setIsExpanded(false);
    }
  }, []);

  const handleSearchClick = useCallback((term) => {
    setPreviousComponent(activeComponent);
    setActiveComponent('SearchComponent');
    setSearchTerm(term);
  }, [activeComponent]);

  const handleNewMessage = useCallback(() => {
    setNewMessages(true);
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  useEffect(() => {
    if (activeComponent === 'Chat') {
      setNewMessages(false);
    }
  }, [activeComponent]);

  const navItems = [
    { icon: <ShoppingBagOutlinedIcon />, tooltip: "Sales", component: 'Sales', permission: 'can_edit_sales' },
    { icon: <EventNoteIcon />, tooltip: "Activities", component: 'Activities' },
    { icon: <EqualizerIcon />, tooltip: "Dashboard", component: 'Dashboard', permission: 'can_see_performance' },
    { icon: <StorageIcon />, tooltip: "Stock", component: 'Stock', permission: 'can_edit_stock' },
    { icon: <BuildIcon />, tooltip: "Services", component: 'Services', permission: 'can_edit_product' },
   
    { icon: <BusinessIcon />, tooltip: "Organisation", component: 'Organisation', permission: 'can_edit_staff' },
    { icon: <InventoryIcon />, tooltip: "Batches", component: 'BatchComponent' },
    { icon: <SettingsOutlinedIcon />, tooltip: "Pipelines", component: 'Pipelines', permission: 'can_edit_pipeline' },
    { icon: <CloudUploadOutlinedIcon />, tooltip: "Upload Files", component: 'UploadFiles', permission: 'can_edit_files' },
    { icon: <HistoryIcon />, tooltip: "UserTable", component: 'UserTable', permission: 'can_edit_sales' },
  ];

  const renderComponent = () => {
    if (!user) return null;

    switch (activeComponent) {
      case 'Sales':
        return user.permissions.can_edit_sales ? <Sales userId={user.id} /> : null;
        case 'UserTable':
        return user.permissions.can_edit_sales ? <UserTable userId={user.id} /> : null;
      case 'Activities':
        return <Activities userId={user.id} userRole={user.role} />;
      case 'Dashboard':
        return user.permissions.can_see_performance ? <Dashboard /> : null;
      case 'Stock':
        return user.permissions.can_edit_stock ? <Stock userId={user.id} /> : null;
      case 'Services':
        return user.permissions.can_edit_product ? <Services userId={user.id} /> : null;
      case 'Organisation':
        return user.permissions.can_edit_staff ? <Organisation userId={user.id} /> : null;
      case 'UploadFiles':
        return user.permissions.can_edit_files ? <UploadFiles userId={user.id} /> : null;
      case 'BatchComponent':
        return <BatchComponent userId={user.id} />;
      case 'Pipelines':
        return user.permissions.can_edit_pipeline ? <Pipelines userId={user.id} /> : null;
      case 'SearchComponent':
        return <SearchComponent searchTerm={searchTerm}  userId={user.id} />;
      default:
        return user.permissions.can_see_performance ? <Dashboard /> : <Activities userId={user.id} />;
    }
  };

  const showSnackbar = useCallback((message, severity) => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <CircularProgress />
      </div>
    );
  }

  if (!user) {
    return null; // or redirect to login
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`sticky top-0 h-screen bg-white shadow-lg flex flex-col items-start py-4 px-3 border-r border-gray-200 transition-all duration-300 ${
          isExpanded ? 'w-48' : 'w-20 items-center'
        }`}
      >
        <div className="flex items-center justify-center mt-6 mb-6 w-full">
          <img src="https://upload.wikimedia.org/wikipedia/commons/4/43/Logo-WS.png" alt="Logo" className="w-10 h-10" />
        </div>
        <nav className={`flex flex-col w-full ${isExpanded ? 'space-y-1' : 'space-y-1 items-center'}`}>
          {navItems.map((item, index) => (
            (!item.permission || user.permissions[item.permission]) && (
              <Tooltip key={index} title={!isExpanded ? item.tooltip : ''} placement="right">
                <button
                  onClick={() => setActiveComponent(item.component)}
                  className={`p-2 uppercase rounded-lg hover:bg-blue-100 transition duration-200 flex items-center ${
                    isExpanded ? 'pl-2 pr-3' : 'justify-center'
                  } ${activeComponent === item.component ? 'bg-blue-100' : ''}`}
                >
                  <Badge
                    color="error"
                    variant="dot"
                    invisible={item.component !== 'Chat' || !newMessages}
                  >
                    {React.cloneElement(item.icon, { className: "text-gray-600", style: { fontSize: '1.75rem' } })}
                  </Badge>
                  {isExpanded && <span className="ml-3 text-xs font-semibold text-gray-700">{item.tooltip}</span>}
                </button>
              </Tooltip>
            )
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-x-auto">
        {/* Topbar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-300 w-full">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-3" style={{ width: '100%' }}>
              <div className="flex items-center space-x-4">
                <Tooltip title="Toggle Sidenav">
                  <button onClick={handleToggle} className="p-2 rounded-full text-gray-500 hover:bg-gray-100">
                    <MenuIcon />
                  </button>
                </Tooltip>
                <SearchBar onSearch={handleSearchClick} currentUserId={user.id} />
              </div>
              <div className="flex items-center space-x-4">
                <Menu
                  anchorEl={addMenuAnchorEl}
                  open={Boolean(addMenuAnchorEl)}
                  onClose={handleAddMenuClose}
                >
                  <MenuItem onClick={handleAddMenuClose} className="flex items-center">
                    <AddIcon className="mr-2" style={{ fontSize: '20px' }} />
                    <span className="text-sm">Add Direct Sale</span>
                  </MenuItem>
                </Menu>
                <button
                  className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white text-lg font-bold uppercase"
                  onClick={handleMenuOpen}
                >
                  {user.username[0].toUpperCase()}
                </button>

                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                >
                  <MenuItem onClick={handleMenuClose} className="flex items-center">
                    <SettingsOutlinedIcon className="mr-2" style={{ fontSize: '20px' }} />
                    <span className="text-sm">Settings</span>
                  </MenuItem>
                  <MenuItem onClick={() => { handleMenuClose(); localStorage.removeItem('user'); window.location.href = '/login'; }} className="flex items-center">
                    <ExitToAppIcon className="mr-2" style={{ fontSize: '20px' }} />
                    <span className="text-sm">Logout</span>
                  </MenuItem>
                </Menu>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className=" flex-1">
          <div className="max-w-full">
            {renderComponent()}
          </div>
        </div>
      </div>

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

export default HomePage;
