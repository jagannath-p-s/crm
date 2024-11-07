import React, { useState } from 'react';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CommentIcon from '@mui/icons-material/Comment';
import EventNoteIcon from '@mui/icons-material/EventNote';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import AddTaskDialog from './AddTaskDialog'; // Ensure this path is correct

const FollowUpCard = ({ task, user, color, visibleFields }) => {
  const [open, setOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);

  const userInitial = user?.username ? user.username.charAt(0).toUpperCase() : 'J';
  const username = user?.username ? user.username : 'Unknown User';

  const handleInitialClick = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleAddClick = () => {
    setAddTaskOpen(true);
  };

  const handleAddTaskClose = () => {
    setAddTaskOpen(false);
  };

  const getTextColorClass = (color) => {
    switch (color) {
      case 'blue':
        return 'text-blue-600';
      case 'red':
        return 'text-red-600';
      case 'green':
        return 'text-green-600';
      case 'yellow':
        return 'text-yellow-600';
      case 'purple':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!task || !user) {
    return <div>Error: task or user data is missing.</div>;
  }

  return (
    <div className="mb-4 p-4 bg-white rounded-lg shadow-md border border-gray-200 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-2">
          <h2 className={`text-lg font-semibold truncate ${getTextColorClass(color)}`}>
            {task.task_name}
          </h2>
          <EventNoteIcon className="text-blue-500" />
        </div>
        {visibleFields.task_message && <p className="text-sm mb-1">Message: {task.task_message}</p>}
        {visibleFields.submission_date && <p className="text-sm mb-1">Date: {new Date(task.submission_date).toLocaleDateString()}</p>}
        {visibleFields.completion_status && <p className="text-sm mb-1">Status: {task.completion_status}</p>}
        {visibleFields.type && <p className="text-sm mb-1">Type: {task.type}</p>}
        {visibleFields.assignedto && <p className="text-sm mb-1">Assigned To: {username}</p>}
      </div>
      <div className="flex justify-end items-center space-x-2 mt-2">
        <Tooltip title="Add">
          <button className="p-1 rounded-full hover:bg-gray-200" onClick={handleAddClick}>
            <AddIcon fontSize="small" />
          </button>
        </Tooltip>
        <Tooltip title="Edit">
          <button className="p-1 rounded-full hover:bg-gray-200">
            <EditIcon fontSize="small" />
          </button>
        </Tooltip>
        <Tooltip title="Comment">
          <button className="p-1 rounded-full hover:bg-gray-200">
            <CommentIcon fontSize="small" />
          </button>
        </Tooltip>
        <Tooltip title="Assigned To">
          <div 
            className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center cursor-pointer"
            onClick={handleInitialClick}
          >
            {userInitial}
          </div>
        </Tooltip>
      </div>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Assigned To</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {username}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <AddTaskDialog
        open={addTaskOpen}
        handleClose={handleAddTaskClose}
        taskId={task.id}
        assignedBy={user.id}
      />
    </div>
  );
};

export default FollowUpCard;
