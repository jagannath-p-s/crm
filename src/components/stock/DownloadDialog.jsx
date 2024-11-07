import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CloseIcon from '@mui/icons-material/Close';
import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const DownloadDialog = ({
  open,
  handleClose,
  visibleColumns = {}, // Default to an empty object if undefined
  filteredProducts = [], // Default to an empty array if undefined
  categories = [],
  subcategories = [],
}) => {
  const handleDownloadCSV = () => {
    if (!filteredProducts.length) {
      console.error('No products available to download.');
      return;
    }

    const visibleProducts = filteredProducts.map((product) => {
      const result = {};
      result['SL No'] = product.slno;
      if (visibleColumns.barcodeNumber) result['Barcode Number'] = product.barcode_number;
      if (visibleColumns.itemName) result['Item Name'] = product.item_name;
      if (visibleColumns.companyName) result['Company Name'] = product.company_name;
      if (visibleColumns.category)
        result['Category'] = categories.find((cat) => cat.category_id === product.category_id)?.category_name;
      if (visibleColumns.subcategory)
        result['Subcategory'] = subcategories.find((sub) => sub.subcategory_id === product.subcategory_id)?.subcategory_name;
      if (visibleColumns.price) result['Price'] = product.price;
      if (visibleColumns.minStock) result['Min Stock'] = product.min_stock;
      if (visibleColumns.currentStock) result['Current Stock'] = product.current_stock;
      if (visibleColumns.itemAlias) result['Item Alias'] = product.item_alias;
      if (visibleColumns.modelNumber) result['Model Number'] = product.model_number;
      if (visibleColumns.uom) result['UOM'] = product.uom;
      if (visibleColumns.imageLink) result['Image Link'] = product.image_link;
      return result;
    });

    const csv = Papa.unparse(visibleProducts);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleDownloadPDF = () => {
    if (!filteredProducts.length) {
      console.error('No products available to download.');
      return;
    }

    const doc = new jsPDF('landscape', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    doc.setFontSize(18);
    doc.text('Product Data', pageWidth / 2, 30, { align: 'center' });

    const columns = [
      { header: 'SL No', dataKey: 'slno' },
      ...Object.entries(visibleColumns)
        .filter(([key, visible]) => visible && key !== 'imageLink')
        .map(([key]) => ({
          header: key.replace(/([A-Z])/g, ' $1').trim(),
          dataKey: key,
        })),
    ];

    const data = filteredProducts.map((product) => {
      const result = {};
      result.slno = product.slno;
      if (visibleColumns.barcodeNumber) result.barcodeNumber = product.barcode_number || '';
      if (visibleColumns.itemName) result.itemName = product.item_name || '';
      if (visibleColumns.companyName) result.companyName = product.company_name || '';
      if (visibleColumns.category)
        result.category = categories.find((cat) => cat.category_id === product.category_id)?.category_name || '';
      if (visibleColumns.subcategory)
        result.subcategory = subcategories.find((sub) => sub.subcategory_id === product.subcategory_id)?.subcategory_name || '';
      if (visibleColumns.price) result.price = product.price !== undefined ? product.price.toFixed(2) : '';
      if (visibleColumns.minStock) result.minStock = product.min_stock || '';
      if (visibleColumns.currentStock) result.currentStock = product.current_stock || '';
      if (visibleColumns.itemAlias) result.itemAlias = product.item_alias || '';
      if (visibleColumns.modelNumber) result.modelNumber = product.model_number || '';
      if (visibleColumns.uom) result.uom = product.uom || '';
      return result;
    });

    doc.autoTable({
      columns,
      body: data,
      startY: 50,
      margin: { top: 50, right: 30, bottom: 40, left: 30 },
      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: 'linebreak',
        halign: 'left',
        valign: 'middle',
      },
      headStyles: {
        fillColor: [66, 135, 245],
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240],
      },
      columnStyles: {
        price: { halign: 'right' },
        minStock: { halign: 'right' },
        currentStock: { halign: 'right' },
      },
      didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.text(
          `Page ${data.pageNumber} of ${doc.internal.getNumberOfPages()}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      },
    });

    doc.save('products.pdf');
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            Download Product Data
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Select the format to download the product data:
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
          <Button
            variant="contained"
            onClick={handleDownloadPDF}
            startIcon={<PictureAsPdfIcon />}
            sx={{ flex: 1, mx: 1 }}
          >
            PDF
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleDownloadCSV}
            startIcon={<DownloadIcon />}
            sx={{ flex: 1, mx: 1 }}
          >
            CSV
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default DownloadDialog;
