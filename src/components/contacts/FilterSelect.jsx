import React, { useState } from 'react';
import { Box, Menu, MenuItem, TextField, Tooltip, Divider } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import dayjs from 'dayjs';

const FilterSelect = ({
  label,
  value,
  handleChange,
  options,
  withDatePicker,
  startDate,
  endDate,
  handleStartDateChange,
  handleEndDateChange,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (selectedValue) => {
    handleChange(selectedValue);
    if (selectedValue !== 'Custom Date Range') {
      handleClose();
    }
  };

  const handleDateChange = (setter, date) => {
    setter(date);
    if (startDate && endDate) {
      handleClose();
    }
  };

  return (
    <Box display="flex" alignItems="center">
      <Tooltip title={`Filter by ${label}`}>
        <button
          className={`py-2 px-4 rounded-full border ${anchorEl ? 'border-blue-600 bg-blue-100' : 'border-gray-300'} focus:outline-none transition duration-150 ease-in-out`}
          onClick={handleOpen}
        >
          {value || label}
          <ArrowDropDownIcon className="ml-1" />
        </button>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          style: {
            padding: '10px',
            minWidth: '200px',
          },
        }}
      >
        {options.map((option) => (
          <MenuItem
            key={option}
            onClick={() => handleSelect(option)}
            style={{
              padding: '8px 16px',
              margin: '4px 0',
            }}
          >
            {option}
          </MenuItem>
        ))}
        {withDatePicker && value === 'Custom Date Range' && (
          <>
            <Divider sx={{ my: 1 }} />
            <Box px={1} py={1} display="flex" flexDirection="column" gap={1}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(date) => handleDateChange(handleStartDateChange, date)}
                  renderInput={(params) => <TextField {...params} size="small" margin="normal" />}
                />
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(date) => handleDateChange(handleEndDateChange, date)}
                  renderInput={(params) => <TextField {...params} size="small" margin="normal" />}
                />
              </LocalizationProvider>
            </Box>
          </>
        )}
      </Menu>
    </Box>
  );
};

export default FilterSelect;
