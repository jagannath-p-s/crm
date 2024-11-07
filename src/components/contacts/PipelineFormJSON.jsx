import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  Button,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Grid,
  IconButton,
  Paper,
} from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  backgroundColor: theme.palette.background.default,
  minHeight: '120px',
}));

const BlueCheckbox = styled(Checkbox)({
  '&.Mui-checked': {
    color: '#007BFF',
  },
});

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const PipelineFormJSON = ({ enquiryId }) => {
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [stages, setStages] = useState([]);
  const [currentStage, setCurrentStage] = useState(null);
  const [fields, setFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingFields, setEditingFields] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [filePreviewDialog, setFilePreviewDialog] = useState({ open: false, url: '', type: '' });
  const [activeStep, setActiveStep] = useState(0);
  const fieldRefs = useRef({});

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const fetchPipelines = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('pipelines').select('*');
      if (error) throw error;
      setPipelines(data);
    } catch (error) {
      showSnackbar('Failed to fetch pipelines', 'error');
      console.error('Error fetching pipelines:', error);
    }
  }, []);

  const fetchExistingData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('enquiries')
        .select('pipeline_id, current_stage_id')
        .eq('id', enquiryId)
        .single();

      if (error) throw error;

      if (data?.pipeline_id) {
        setSelectedPipeline(data.pipeline_id);
        await fetchStages(data.pipeline_id, data.current_stage_id);
        await fetchPipelineData(data.pipeline_id);
      }
    } catch (error) {
      showSnackbar('Failed to fetch existing data', 'error');
      console.error('Error fetching existing data:', error);
    } finally {
      setLoading(false);
    }
  }, [enquiryId]);

  const fetchStages = useCallback(async (pipelineId, currentStageId) => {
    try {
      const { data, error } = await supabase
        .from('pipeline_stages')
        .select('*')
        .eq('pipeline_id', pipelineId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setStages(data);

      if (data.length > 0) {
        const stageIndex = data.findIndex(stage => stage.stage_id === currentStageId);
        if (stageIndex !== -1) {
          setCurrentStage(currentStageId);
          setActiveStep(stageIndex);
          await fetchFields(currentStageId);
        } else {
          setCurrentStage(data[0].stage_id);
          setActiveStep(0);
          await fetchFields(data[0].stage_id);
        }
      }
    } catch (error) {
      showSnackbar('Failed to fetch stages', 'error');
      console.error('Error fetching stages:', error);
    }
  }, []);

  const fetchFields = useCallback(async (stageId) => {
    if (!stageId) return;
    try {
      const { data, error } = await supabase
        .from('pipeline_fields')
        .select('*')
        .eq('stage_id', stageId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setFields(data);
      setEditingFields({});
    } catch (error) {
      showSnackbar('Failed to fetch fields', 'error');
      console.error('Error fetching fields:', error);
    }
  }, []);

  const fetchPipelineData = useCallback(async (pipelineId) => {
    try {
      const { data, error } = await supabase
        .from('pipeline_data_json')
        .select('*')
        .eq('enquiry_id', enquiryId)
        .eq('pipeline_id', pipelineId);

      if (error) throw error;

      const formattedData = data.reduce((acc, item) => {
        acc[item.stage_id] = item.data;
        return acc;
      }, {});

      setFormData(formattedData);
    } catch (error) {
      showSnackbar('Failed to fetch pipeline data', 'error');
      console.error('Error fetching pipeline data:', error);
    }
  }, [enquiryId]);

  useEffect(() => {
    fetchPipelines();
    fetchExistingData();
  }, [fetchPipelines, fetchExistingData]);

  const handlePipelineChange = async (event) => {
    const pipelineId = event.target.value;
    setSelectedPipeline(pipelineId);
    setFormData({});
    setCurrentStage(null);
    setActiveStep(0);

    try {
      const { error } = await supabase
        .from('enquiries')
        .update({ pipeline_id: pipelineId })
        .eq('id', enquiryId);

      if (error) throw error;

      showSnackbar('Pipeline selected successfully', 'success');
      await fetchStages(pipelineId);
    } catch (error) {
      showSnackbar('Failed to save selected pipeline', 'error');
      console.error('Error saving selected pipeline:', error);
    }
  };

  const handleStageChange = async (stageId, index) => {
    setCurrentStage(stageId);
    setActiveStep(index);
    await fetchFields(stageId);
  };

  const handleInputChange = (fieldId, value) => {
    setFormData((prevData) => ({
      ...prevData,
      [currentStage]: {
        ...prevData[currentStage],
        [fieldId]: value,
      },
    }));
  };

  const handleFileUpload = async (fieldId, file) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) throw new Error('User not authenticated');

      const uniqueFileName = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(uniqueFileName, file);

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from('uploaded_files').insert([
        {
          file_name: file.name,
          file_path: uniqueFileName,
          uploaded_by: user.id,
          file_size: file.size,
          file_type: file.type,
        },
      ]);

      if (insertError) throw insertError;

      handleInputChange(fieldId, uniqueFileName);
      showSnackbar('File uploaded successfully', 'success');
    } catch (error) {
      showSnackbar(`Failed to upload file: ${error.message}`, 'error');
      console.error('Error uploading file:', error);
    }
  };

  const handleFileView = async (filePath) => {
    try {
      const { data, error } = await supabase.storage.from('files').download(filePath);
      if (error) throw error;

      const url = URL.createObjectURL(data);
      const fileType = data.type;

      setFilePreviewDialog({
        open: true,
        url,
        type: fileType,
      });
    } catch (error) {
      showSnackbar(`Error viewing file: ${error.message}`, 'error');
    }
  };

  const handleFileDownload = async (filePath) => {
    try {
      const { data, error } = await supabase.storage.from('files').download(filePath);
      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = filePath.split('/').pop();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      showSnackbar(`Error downloading file: ${error.message}`, 'error');
    }
  };

  const handleEditField = (fieldId) => {
    setEditingFields((prev) => ({ ...prev, [fieldId]: true }));
    setTimeout(() => {
      fieldRefs.current[fieldId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 200);
  };

  const handleSaveField = async (fieldId) => {
    try {
      const { error } = await supabase
        .from('pipeline_data_json')
        .upsert({
          enquiry_id: enquiryId,
          pipeline_id: selectedPipeline,
          stage_id: currentStage,
          data: { ...formData[currentStage], [fieldId]: formData[currentStage]?.[fieldId] },
        }, { onConflict: ['enquiry_id', 'pipeline_id', 'stage_id'] });

      if (error) throw error;

      setEditingFields((prev) => ({ ...prev, [fieldId]: false }));
      showSnackbar('Field updated successfully', 'success');
    } catch (error) {
      showSnackbar(`Failed to save field: ${error.message}`, 'error');
      console.error('Error saving field:', error);
    }
  };

  const handleCancelEdit = (fieldId) => {
    setEditingFields((prev) => ({ ...prev, [fieldId]: false }));
    setFormData((prevData) => ({
      ...prevData,
      [currentStage]: {
        ...prevData[currentStage],
        [fieldId]: prevData[currentStage]?.[fieldId] || '',
      },
    }));
  };

  const handleSaveStage = async () => {
    if (!selectedPipeline || !currentStage) {
      showSnackbar('Please select a pipeline and stage before saving', 'error');
      return;
    }

    try {
      const { error: saveDataError } = await supabase.from('pipeline_data_json').upsert(
        {
          enquiry_id: enquiryId,
          pipeline_id: selectedPipeline,
          stage_id: currentStage,
          data: formData[currentStage] || {},
        },
        { onConflict: ['enquiry_id', 'pipeline_id', 'stage_id'] }
      );

      if (saveDataError) throw saveDataError;

      const { error: updateEnquiryError } = await supabase
        .from('enquiries')
        .update({ 
          pipeline_id: selectedPipeline, 
          current_stage_id: currentStage 
        })
        .eq('id', enquiryId);

      if (updateEnquiryError) throw updateEnquiryError;

      showSnackbar('Stage data saved successfully', 'success');
    } catch (error) {
      showSnackbar(`Failed to save stage data: ${error.message}`, 'error');
      console.error('Error saving stage data:', error);
    }
  };

  const renderFieldValue = (field) => {
    const value = formData[currentStage]?.[field.field_id];
    const isEditing = editingFields[field.field_id];

    if (isEditing) {
      switch (field.field_type) {
        case 'textfield':
          return (
            <TextField
              fullWidth
              value={value || ''}
              onChange={(e) => handleInputChange(field.field_id, e.target.value)}
            />
          );
        case 'checkbox':
          return (
            <FormControlLabel
              control={
                <Checkbox
                  checked={value || false}
                  onChange={(e) => handleInputChange(field.field_id, e.target.checked)}
                />
              }
              label="Yes"
            />
          );
        case 'file':
          return (
            <input
              type="file"
              onChange={(e) => handleFileUpload(field.field_id, e.target.files[0])}
            />
          );
        case 'date':
          return (
            <TextField
              type="date"
              fullWidth
              value={value || ''}
              onChange={(e) => handleInputChange(field.field_id, e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          );
        default:
          return null;
      }
    }

    if (field.field_type === 'file' && value) {
      return (
        <Box display="flex" justifyContent="space-between" width="100%">
          <Button
            variant="outlined"
            onClick={() => handleFileView(value)}
            sx={{ width: '48%' }}
          >
            View File
          </Button>
          <Button
            variant="outlined"
            onClick={() => handleFileDownload(value)}
            sx={{ width: '48%' }}
          >
            Download
          </Button>
        </Box>
      );
    }

    if (field.field_type === 'checkbox') {
      return (
        <BlueCheckbox checked={Boolean(value)} disabled />
      );
    }

    if (field.field_type === 'date') {
      return formatDate(value);
    }

    return value || 'N/A';
  };

  const renderField = (field) => {
    const isEditing = editingFields[field.field_id];

    return (
      <Grid item xs={12} sm={6} md={4} key={field.field_id} ref={el => fieldRefs.current[field.field_id] = el}>
        <StyledPaper elevation={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1" fontWeight="bold">
              {field.field_name}
            </Typography>
            <Box>
              {isEditing ? (
                <>
                  <IconButton onClick={() => handleSaveField(field.field_id)} color="primary">
                    <SaveIcon />
                  </IconButton>
                  <IconButton onClick={() => handleCancelEdit(field.field_id)} color="secondary">
                    <CancelIcon />
                  </IconButton>
                </>
              ) : (
                <IconButton onClick={() => handleEditField(field.field_id)} color="primary">
                  <EditIcon />
                </IconButton>
              )}
            </Box>
          </Box>
          <Box minHeight="50px">
            {renderFieldValue(field)}
          </Box>
        </StyledPaper>
      </Grid>
    );
  };

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <StyledFormControl fullWidth>
        <Select
          value={selectedPipeline || ''}
          onChange={handlePipelineChange}
        >
          {pipelines.map((pipeline) => (
            <MenuItem key={pipeline.pipeline_id} value={pipeline.pipeline_id}>
              {pipeline.pipeline_name}
            </MenuItem>
          ))}
        </Select>
      </StyledFormControl>
  
      {selectedPipeline && (
        <>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mt: 4, mb: 2 }}>
            {stages.map((stage, index) => (
              <Step key={stage.stage_id} completed={index < activeStep}>
                <StepLabel onClick={() => handleStageChange(stage.stage_id, index)} style={{ cursor: 'pointer' }}>
                  {stage.stage_name}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
  
          <Box mt={2} display="flex" justifyContent="flex-end">
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleSaveStage}
            >
              Save Stage
            </Button>
          </Box>
  
          <Grid container spacing={2} sx={{ mt: 4 }}>
            {fields.map(renderField)}
          </Grid>
        </>
      )}
  
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
  
      <Dialog
        open={filePreviewDialog.open}
        onClose={() => setFilePreviewDialog({ open: false, url: '', type: '' })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>File Preview</DialogTitle>
        <DialogContent>
          {filePreviewDialog.type.startsWith('image/') ? (
            <img src={filePreviewDialog.url} alt="File preview" style={{ width: '100%', height: 'auto' }} />
          ) : (
            <Typography>
              This file type cannot be previewed. Please download the file to view its contents.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFilePreviewDialog({ open: false, url: '', type: '' })} color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PipelineFormJSON;
