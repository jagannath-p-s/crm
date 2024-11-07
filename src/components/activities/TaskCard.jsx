import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import VisibilityIcon from '@mui/icons-material/Visibility';

const TaskCard = ({ task, user, color, visibleFields, handleContactOpen }) => {
  const getTextColorClass = (color) => {
    const colorMap = {
      blue: 'text-blue-600',
      red: 'text-red-600',
      green: 'text-green-600',
      yellow: 'text-yellow-600',
      purple: 'text-purple-600'
    };
    return colorMap[color] || 'text-gray-600';
  };

  return (
    <div className="mb-4 p-4 bg-white rounded-lg shadow-md border border-gray-200 flex flex-col justify-between">
      <div>
        {visibleFields.task_name && <div className={`text-sm font-bold ${getTextColorClass(color)} mb-2`}>{task.task_name}</div>}
        {visibleFields.task_message && <p className="text-sm mb-1">Message: {task.task_message}</p>}
        {visibleFields.submission_date && <p className="text-sm mb-1">Date: {new Date(task.submission_date).toLocaleDateString()}</p>}
        {visibleFields.completion_status && <p className="text-sm mb-1">Status: {task.completion_status}</p>}
        
      </div>
      <div className="flex justify-end items-center space-x-2 mt-2">
        <Tooltip title="View Enquiry">
          <button className="p-1 rounded-full hover:bg-gray-200" onClick={() => handleContactOpen(task.enquiries)}>
            <VisibilityIcon fontSize="small" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

export default TaskCard;
