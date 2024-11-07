// ProductDialog.jsx
import React from 'react';
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';

const ProductDialog = ({
    open,
    handleClose,
    handleSave,
    selectedProduct,
    productSerialNumber,
    setProductSerialNumber,
    productItemName,
    setProductItemName,
    productItemAlias,
    setProductItemAlias,
    productPartNumber,
    setProductPartNumber,
    productModel,
    setProductModel,
    productRemarks,
    setProductRemarks,
    productStockGroup,
    setProductStockGroup,
    productName,
    setProductName,
    brand,
    setBrand,
    productCategory,
    setProductCategory,
    categories,
    productSubcategory,
    setProductSubcategory,
    subcategories,
    productPrice,
    setProductPrice,
    productMinStock,
    setProductMinStock,
    productCurrentStock,
    setProductCurrentStock,
    handleImageUpload,
    productImagePreview,
    productImageUrl
}) => {
    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
            <DialogTitle>{selectedProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    <TextField
                        label="Serial Number"
                        variant="outlined"
                        fullWidth
                        margin="dense"
                        value={productSerialNumber}
                        onChange={(e) => setProductSerialNumber(e.target.value)}
                    />
                    <TextField
                        label="Item Name"
                        variant="outlined"
                        fullWidth
                        margin="dense"
                        value={productItemName}
                        onChange={(e) => setProductItemName(e.target.value)}
                    />
                    <TextField
                        label="Item Alias"
                        variant="outlined"
                        fullWidth
                        margin="dense"
                        value={productItemAlias}
                        onChange={(e) => setProductItemAlias(e.target.value)}
                    />
                    <TextField
                        label="Part Number"
                        variant="outlined"
                        fullWidth
                        margin="dense"
                        value={productPartNumber}
                        onChange={(e) => setProductPartNumber(e.target.value)}
                    />
                    <TextField
                        label="Model"
                        variant="outlined"
                        fullWidth
                        margin="dense"
                        value={productModel}
                        onChange={(e) => setProductModel(e.target.value)}
                    />
                    <TextField
                        label="Remarks"
                        variant="outlined"
                        fullWidth
                        margin="dense"
                        value={productRemarks}
                        onChange={(e) => setProductRemarks(e.target.value)}
                    />
                    <TextField
                        label="Stock Group"
                        variant="outlined"
                        fullWidth
                        margin="dense"
                        value={productStockGroup}
                        onChange={(e) => setProductStockGroup(e.target.value)}
                    />
                    <TextField
                        label="Product Name"
                        variant="outlined"
                        fullWidth
                        margin="dense"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                    />
                    <TextField
                        label="Brand"
                        variant="outlined"
                        fullWidth
                        margin="dense"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                    />
                    <FormControl fullWidth margin="dense">
                        <InputLabel>Category</InputLabel>
                        <Select
                            value={productCategory}
                            onChange={(e) => setProductCategory(e.target.value)}
                            label="Category"
                        >
                            {categories.map((category) => (
                                <MenuItem key={category.category_id} value={category.category_id}>
                                    {category.category_name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth margin="dense">
                        <InputLabel>Subcategory</InputLabel>
                        <Select
                            value={productSubcategory}
                            onChange={(e) => setProductSubcategory(e.target.value)}
                            label="Subcategory"
                        >
                            {subcategories
                                .filter((sub) => sub.category_id === productCategory)
                                .map((subcategory) => (
                                    <MenuItem key={subcategory.subcategory_id} value={subcategory.subcategory_id}>
                                        {subcategory.subcategory_name}
                                    </MenuItem>
                                ))}
                        </Select>
                    </FormControl>
                    <TextField
                        label="Price"
                        variant="outlined"
                        fullWidth
                        margin="dense"
                        type="number"
                        value={productPrice}
                        onChange={(e) => setProductPrice(e.target.value)}
                    />
                    <TextField
                        label="Min Stock"
                        variant="outlined"
                        fullWidth
                        margin="dense"
                        type="number"
                        value={productMinStock}
                        onChange={(e) => setProductMinStock(e.target.value)}
                    />
                    <TextField
                        label="Current Stock"
                        variant="outlined"
                        fullWidth
                        margin="dense"
                        type="number"
                        value={productCurrentStock}
                        onChange={(e) => setProductCurrentStock(e.target.value)}
                    />
                    <input
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="product-image-upload"
                        type="file"
                        onChange={handleImageUpload}
                    />
                    <label htmlFor="product-image-upload">
                        <Button
                            variant="contained"
                            color="primary"
                            component="span"
                            startIcon={<CloudUploadIcon />}
                            sx={{ mt: 2 }}
                        >
                            Upload Image
                        </Button>
                    </label>
                    {(productImagePreview || productImageUrl) && (
                        <Box sx={{ mt: 2 }}>
                            <img 
                                src={productImagePreview || productImageUrl} 
                                alt="Product" 
                                style={{ maxWidth: '100%', maxHeight: 200 }} 
                            />
                        </Box>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="primary">
                    Cancel
                </Button>
                <Button onClick={handleSave} color="primary">
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ProductDialog;
