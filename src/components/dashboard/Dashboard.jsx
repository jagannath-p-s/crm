import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Select, MenuItem, InputLabel, FormControl, Box, Typography, Grid, Paper, TextField, Button } from '@mui/material';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import PrintIcon from '@mui/icons-material/Print';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { supabase } from '../../supabaseClient'; // Adjust the path as needed
import { useReactToPrint } from 'react-to-print';

// Updated mock data with realistic dates
const mockData = {
  products: [
    { name: 'Agricultural Chaff Cutter VP-01 With 2HP BN & Acces', subcategory: 'Chaffcutter', category: 'Agriculture Machinery', sales: 120, date: '2024-07-15' },
    { name: 'Agricultural Chaff Cutter VP-01 With 2HP SM & Acces', subcategory: 'Chaffcutter', category: 'Agriculture Machinery', sales: 98, date: '2024-07-16' },
    { name: 'Agricultural Chaffcutter VP-02', subcategory: 'Chaffcutter', category: 'Agriculture Machinery', sales: 86, date: '2024-07-17' },
    { name: 'Agricultural Chaff Cutter VP-02 With 2HP SM & Acces', subcategory: 'Chaffcutter', category: 'Agriculture Machinery', sales: 99, date: '2024-07-18' },
    { name: 'Agricultural Chaff Cutter VP-03', subcategory: 'Chaffcutter', category: 'Agriculture Machinery', sales: 85, date: '2024-07-19' },
    { name: 'Agricultural Chaff Cutter VP-03 with 2HP Sm&Acc', subcategory: 'Chaffcutter', category: 'Agriculture Machinery', sales: 65, date: '2024-07-20' },
    { name: 'Agricultural Chaff Cutter VP-04', subcategory: 'Chaffcutter', category: 'Agriculture Machinery', sales: 74, date: '2024-07-21' },
    { name: 'Agricultural Chaffcutter VP-01', subcategory: 'Chaffcutter', category: 'Agriculture Machinery', sales: 79, date: '2024-07-22' },
    { name: 'Agricultural chaff cutter VP-01 with 1.5 Hp SM&Acc', subcategory: 'Chaffcutter', category: 'Agriculture Machinery', sales: 62, date: '2024-07-23' },
    { name: 'Agricultural Chaff Cutter VP-05', subcategory: 'Chaffcutter', category: 'Agriculture Machinery', sales: 55, date: '2024-07-24' },
    { name: '110x90 Reducer Bush', subcategory: 'Reducer', category: 'Irrigation', sales: 90, date: '2024-07-25' },
    { name: '1 1/4 Clamb Ss Original', subcategory: 'Clamp', category: 'Irrigation', sales: 85, date: '2024-07-26' },
    { name: '12mm Bit', subcategory: 'Spare Part', category: 'Spares', sales: 80, date: '2024-07-27' },
    { name: '12mm Drillbit Neta Type SDI', subcategory: 'Spare Part', category: 'Spares', sales: 75, date: '2024-07-28' },
    { name: '12MM Joiner Black SDI', subcategory: 'Spare Part', category: 'Spares', sales: 70, date: '2024-07-29' },
  ],
  topSalesmen: {
    daily: [
      { name: 'Sanoop', sales: 20, date: '2024-07-30' },
      { name: 'Sijosh', sales: 18, date: '2024-07-30' },
      { name: 'Sruthi', sales: 22, date: '2024-07-30' },
      { name: 'Sumi', sales: 14, date: '2024-07-30' },
      { name: 'Sajana', sales: 16, date: '2024-07-30' },
    ],
    weekly: [
      { name: 'Sanoop', sales: 140, date: '2024-07-24' },
      { name: 'Sijosh', sales: 126, date: '2024-07-24' },
      { name: 'Sruthi', sales: 154, date: '2024-07-24' },
      { name: 'Sumi', sales: 98, date: '2024-07-24' },
      { name: 'Sajana', sales: 112, date: '2024-07-24' },
    ],
    monthly: [
      { name: 'Sanoop', sales: 600, date: '2024-07-01' },
      { name: 'Sijosh', sales: 540, date: '2024-07-01' },
      { name: 'Sruthi', sales: 660, date: '2024-07-01' },
      { name: 'Sumi', sales: 420, date: '2024-07-01' },
      { name: 'Sajana', sales: 480, date: '2024-07-01' },
    ],
    yearly: [
      { name: 'Sanoop', sales: 7200, date: '2024-01-01' },
      { name: 'Sijosh', sales: 6480, date: '2024-01-01' },
      { name: 'Sruthi', sales: 7920, date: '2024-01-01' },
      { name: 'Sumi', sales: 5040, date: '2024-01-01' },
      { name: 'Sajana', sales: 5760, date: '2024-01-01' },
    ],
  },
  salesReport: {
    daily: [
      { date: '2024-07-24', sales: 2400 },
      { date: '2024-07-25', sales: 1398 },
      { date: '2024-07-26', sales: 9800 },
      { date: '2024-07-27', sales: 3908 },
      { date: '2024-07-28', sales: 4800 },
      { date: '2024-07-29', sales: 3800 },
      { date: '2024-07-30', sales: 4300 },
    ],
    monthly: [
      { month: 'Jan', sales: 4000, date: '2024-01-01' },
      { month: 'Feb', sales: 3000, date: '2024-02-01' },
      { month: 'Mar', sales: 5000, date: '2024-03-01' },
      { month: 'Apr', sales: 4500, date: '2024-04-01' },
      { month: 'May', sales: 6000, date: '2024-05-01' },
      { month: 'Jun', sales: 5500, date: '2024-06-01' },
      { month: 'Jul', sales: 7000, date: '2024-07-01' },
    ],
    yearly: [
      { year: '2020', sales: 30000, date: '2020-01-01' },
      { year: '2021', sales: 35000, date: '2021-01-01' },
      { year: '2022', sales: 40000, date: '2022-01-01' },
      { year: '2023', sales: 45000, date: '2023-01-01' },
      { year: '2024', sales: 50000, date: '2024-01-01' },
    ],
  },
};

const Dashboard = () => {
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [subcategoryFilter, setSubcategoryFilter] = useState('All');
  const [salesReportType, setSalesReportType] = useState('daily');
  const [salesmanTimeFrame, setSalesmanTimeFrame] = useState('daily');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const [serviceIncome, setServiceIncome] = useState({});
  const [technicianPerformance, setTechnicianPerformance] = useState([]);

  const categories = ['All', ...new Set(mockData.products.map(product => product.category))];
  const subcategories = ['All', ...new Set(mockData.products.filter(product => categoryFilter === 'All' || product.category === categoryFilter).map(product => product.subcategory))];

  const filteredProducts = mockData.products.filter(product =>
    (categoryFilter === 'All' || product.category === categoryFilter) &&
    (subcategoryFilter === 'All' || product.subcategory === subcategoryFilter)
  );

  const salesReportData = mockData.salesReport[salesReportType];
  const topSalesmenData = mockData.topSalesmen[salesmanTimeFrame];

  const handleDateChange = (start, end) => {
    setStartDate(start);
    setEndDate(end);
  };

  const applyDateFilter = (data) => {
    if (!startDate || !endDate) return data;
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    return data.filter(item => {
      const date = new Date(item.date || item.month || item.year).getTime();
      return date >= start && date <= end;
    });
  };

  const filteredSalesReportData = applyDateFilter(salesReportData);

  useEffect(() => {
    const fetchServiceData = async () => {
      const { data, error } = await supabase
        .from('service_enquiries')
        .select('total_amount, technician_name');
      if (error) {
        console.error('Error fetching service data:', error);
      } else {
        const income = data.reduce((acc, enquiry) => {
          acc.total += enquiry.total_amount;
          acc.today += enquiry.total_amount; // Adjust this logic based on real "today" filter
          acc.week += enquiry.total_amount; // Adjust this logic based on real "week" filter
          acc.month += enquiry.total_amount; // Adjust this logic based on real "month" filter
          acc.year += enquiry.total_amount; // Adjust this logic based on real "year" filter
          return acc;
        }, { today: 0, week: 0, month: 0, year: 0, total: 0 });

        setServiceIncome(income);

        const performance = data.reduce((acc, enquiry) => {
          const technician = acc.find(t => t.name === enquiry.technician_name);
          if (technician) {
            technician.income += enquiry.total_amount;
          } else {
            acc.push({ name: enquiry.technician_name, income: enquiry.total_amount });
          }
          return acc;
        }, []);

        setTechnicianPerformance(performance);
      }
    };

    fetchServiceData();
  }, []);

  const componentRef = useRef();
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  const PrintableTable = ({ data, columns }) => (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
      <thead>
        <tr>
          {columns.map((column, index) => (
            <th key={index} style={{ border: '1px solid black', padding: '8px', backgroundColor: '#f2f2f2' }}>
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {columns.map((column, colIndex) => (
              <td key={colIndex} style={{ border: '1px solid black', padding: '8px' }}>
                {row[column.toLowerCase()]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <Box className="p-4">
      {/* Header */}
      <div className="bg-white shadow-md mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <ShoppingBagOutlinedIcon className="text-blue-500" style={{ fontSize: '1.75rem' }} />
                <h1 className="text-xl font-semibold ml-2">Sales Dashboard</h1>
              </div>
            </div>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
            >
              Print Reports
            </Button>
          </div>
        </div>
      </div>

      <div style={{ display: 'none' }}>
        <div ref={componentRef}>
          <h2>Sales Report</h2>
          <PrintableTable 
            data={filteredSalesReportData} 
            columns={['Date', 'Sales']} 
          />
          
          <h2>Top Selling Products</h2>
          <PrintableTable 
            data={filteredProducts} 
            columns={['Name', 'Category', 'Subcategory', 'Sales']} 
          />
          
          <h2>Top Salesman Performance</h2>
          <PrintableTable 
            data={topSalesmenData} 
            columns={['Name', 'Sales']} 
          />
          
          <h2>Technician Performance</h2>
          <PrintableTable 
            data={technicianPerformance} 
            columns={['Name', 'Income']} 
          />
        </div>
      </div>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categories.map((category, index) => (
                <MenuItem key={index} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Subcategory</InputLabel>
            <Select
              value={subcategoryFilter}
              onChange={(e) => setSubcategoryFilter(e.target.value)}
            >
              {subcategories.map((subcategory, index) => (
                <MenuItem key={index} value={subcategory}>
                  {subcategory}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Sales Report Type</InputLabel>
            <Select
              value={salesReportType}
              onChange={(e) => setSalesReportType(e.target.value)}
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Salesman Time Frame</InputLabel>
            <Select
              value={salesmanTimeFrame}
              onChange={(e) => setSalesmanTimeFrame(e.target.value)}
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <ReactDatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            placeholderText="Start Date"
            customInput={<TextField fullWidth label="Start Date" />}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <ReactDatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            placeholderText="End Date"
            customInput={<TextField fullWidth label="End Date" />}
          />
        </Grid>
        <Grid item xs={12}>
          <Paper className="p-4">
            <Typography variant="h6" gutterBottom>
              Sales Report
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={filteredSalesReportData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper className="p-4">
            <Typography variant="h6" gutterBottom>
              Top Selling Products
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={filteredProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sales" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper className="p-4">
            <Typography variant="h6" gutterBottom>
              Top Salesman Performance
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topSalesmenData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sales" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
