import React from 'react';

const BillContent = ({ customer, jobCardNumber, products, waitingNumber, pipelineName }) => {
  const calculateTotal = () => {
    return Object.values(products).reduce((total, product) => {
      return total + (product.quantity * product.price || 0);
    }, 0);
  };

  return (
    <div className="text-xs leading-tight" style={{ width: '3in' }}>
      <h2 className="text-center font-bold">Haritha Agritech</h2>
      <p className="text-center text-[10px]">
        AKKIKAVU, NEAR PERUMPILAVU<br />
        KUNNAMKULAM-KOZHIKODE ROAD<br />
        KERALA, INDIA<br />
        PH: 9747403390 | GSTIN: 29GGGGG1314R9Z6
      </p>
      <div className="border-t border-b border-black my-1 py-1 flex justify-between">
        <span>Bill: {jobCardNumber}</span>
        <span>{new Date().toLocaleDateString()}</span>
      </div>
      <div className="border-t border-b border-black my-1 py-1">
        <p>Customer Name: {customer.name}</p>
        <p>Mobile Number: {customer.mobilenumber1}</p>
        <p>Waiting Number: {waitingNumber}</p>
        <p>Pipeline: {pipelineName}</p>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-black">
            <th className="text-left">Item</th>
            <th className="text-right">Qty</th>
            <th className="text-right">Price</th>
            <th className="text-right">Amt</th>
          </tr>
        </thead>
        <tbody>
          {Object.values(products).map((product) => (
            <tr key={product.product_id} className="border-b border-dotted border-gray-400">
              <td className="text-left">{product.product_name}</td>
              <td className="text-right">{product.quantity}</td>
              <td className="text-right">{product.price.toFixed(2)}</td>
              <td className="text-right">{(product.quantity * product.price).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-black mt-1 pt-1 text-right">
        <strong>Total: Rs. {calculateTotal().toFixed(2)}</strong>
      </div>
      <p className="text-center mt-2">Thank You</p>
    </div>
  );
};

export default BillContent;
