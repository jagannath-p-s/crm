import React, { useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { ChevronDown, ChevronUp, Download } from 'lucide-react';
import { Alert, AlertTitle } from '@mui/material';

const QuickAnalytics = ({ totalIncome, technicianPerformance, filteredEnquiries }) => {
  const [expanded, setExpanded] = useState(false);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    doc.text('Quick Report', 14, 16);
    doc.text(`Total Service Income: ${totalIncome.toFixed(2)}`, 14, 24);

    const performanceData = Object.keys(technicianPerformance).map((technician) => [
      technician,
      technicianPerformance[technician].total,
      technicianPerformance[technician].completed,
      technicianPerformance[technician].ongoing,
    ]);

    const enquiryData = filteredEnquiries.map((enquiry, index) => [
      index + 1,
      new Date(enquiry.date).toLocaleDateString(),
      enquiry.job_card_no,
      enquiry.customer_name,
      enquiry.customer_mobile,
      enquiry.technician_name,
      `${enquiry.total_amount?.toFixed(2) || 'N/A'}`,
      enquiry.status,
      new Date(enquiry.expected_completion_date).toLocaleDateString(),
    ]);

    doc.autoTable({
      head: [['Technician', 'Total Enquiries', 'Completed', 'Ongoing']],
      body: performanceData,
      startY: 30,
    });

    doc.autoTable({
      head: [['No.', 'Enquiry Date', 'Job Card No', 'Customer Name', 'Customer Mobile', 'Technician Name', 'Total Amount', 'Status', 'Expected Completion']],
      body: enquiryData,
      startY: doc.lastAutoTable.finalY + 10,
    });

    doc.save('quick_report.pdf');
  };

  return (
    <div className="bg-white shadow-md border-t border-gray-300 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Quick Report</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              {expanded ? (
                <ChevronUp className="w-6 h-6 text-gray-600" />
              ) : (
                <ChevronDown className="w-6 h-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {expanded && (
        <div className="p-4 space-y-4">
          <Alert severity="info">
            <AlertTitle>Total Service Income</AlertTitle>
            <div className="text-2xl font-bold">
              ₹{totalIncome.toFixed(2)}
            </div>
          </Alert>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(technicianPerformance).map(([technician, data]) => (
              <div key={technician} className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">{technician}</h3>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">
                    Total Enquiries: <span className="font-medium">{data.total}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Completed: <span className="font-medium text-green-600">{data.completed}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Ongoing: <span className="font-medium text-yellow-600">{data.ongoing}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickAnalytics;
