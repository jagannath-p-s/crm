import React from 'react';
import { Box, Typography, Chip } from '@mui/material';

const InnerTaskContactCard = ({ contact, visibleFields }) => {
  const parseProducts = (products) => {
    if (!products) return {};
    if (typeof products === 'string') {
      try {
        const cleanedProducts = products
          .replace(/""/g, '"')
          .replace(/\\\\"/g, '"')
          .replace(/"({)/g, '$1')
          .replace(/(})"/g, '$1');
        return JSON.parse(cleanedProducts);
      } catch (error) {
        console.error('Error parsing products:', error);
        return {};
      }
    }
    return products; // If it's already an object, return as is
  };

  const productsData = parseProducts(contact?.products);

  return (
    <div className="mb-4 p-4 bg-white rounded-lg shadow-md border border-gray-200 flex flex-col justify-between">
      <div>
        {visibleFields.name && <div className="text-sm font-bold text-gray-700 mb-2">{contact.name}</div>}
        {visibleFields.mobilenumber1 && <p className="text-sm mb-1">Contact No: {contact.mobilenumber1}</p>}
        {visibleFields.mobilenumber2 && <p className="text-sm mb-1">Contact No 2: {contact.mobilenumber2}</p>}
        {visibleFields.address && <p className="text-sm mb-1">Address: {contact.address}</p>}
        {visibleFields.location && <p className="text-sm mb-1">Location: {contact.location}</p>}
        {visibleFields.stage && <p className="text-sm mb-1">Stage: {contact.stage}</p>}
        {visibleFields.mailid && <p className="text-sm mb-1">Email: {contact.mailid}</p>}
        {visibleFields.leadsource && <p className="text-sm mb-1">Lead Source: {contact.leadsource}</p>}
        {visibleFields.remarks && <p className="text-sm mb-1">Remarks: {contact.remarks}</p>}
        {visibleFields.priority && <p className="text-sm mb-1">Priority: {contact.priority}</p>}
        {visibleFields.invoiced && <p className="text-sm mb-1">Invoiced: {contact.invoiced ? 'Yes' : 'No'}</p>}
        {visibleFields.collected && <p className="text-sm mb-1">Collected: {contact.collected ? 'Yes' : 'No'}</p>}
        {visibleFields.created_at && <p className="text-sm mb-1">Date Created: {new Date(contact.created_at).toLocaleDateString()}</p>}
        {visibleFields.salesflow_code && <p className="text-sm mb-1">Salesflow Code: {contact.salesflow_code}</p>}
        {visibleFields.last_updated && <p className="text-sm mb-1">Last Updated: {new Date(contact.last_updated).toLocaleString()}</p>}
        {visibleFields.products && Object.values(productsData).length > 0 && (
          <Box mt={2}>
            <Typography variant="body2">Products:</Typography>
            {Object.values(productsData).map((product, index) => (
              <Chip 
                key={index}
                label={`${product.product_name} (${product.quantity})`}
                size="small"
                sx={{ mr: 1, mt: 1 }}
              />
            ))}
          </Box>
        )}
      </div>
    </div>
  );
};

export default InnerTaskContactCard;
