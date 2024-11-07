import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Snackbar,
  Alert,
  Breadcrumbs,
  Link,
  Tooltip,
  Grid,
} from '@mui/material';
import {
  Delete, Add, ArrowBack, ArrowForward, TextFields, CheckBox, AttachFile, Edit, Event,
} from '@mui/icons-material';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { styled } from '@mui/material/styles';
import { supabase } from '../../supabaseClient';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginTop: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[3],
}));

const StyledButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(1),
  borderRadius: theme.shape.borderRadius * 2,
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

const StyledListItem = styled(ListItem)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  transition: 'background-color 0.3s',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const Pipelines = () => {
  const [pipelines, setPipelines] = useState([]);
  const [stages, setStages] = useState([]);
  const [fields, setFields] = useState([]);
  const [leadSources, setLeadSources] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentPipeline, setCurrentPipeline] = useState(null);
  const [currentStage, setCurrentStage] = useState(null);
  const [currentField, setCurrentField] = useState(null);
  const [currentLeadSource, setCurrentLeadSource] = useState(null);
  const [dialogType, setDialogType] = useState('pipeline');
  const [formData, setFormData] = useState({ name: '', type: 'textfield', district: '', state: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: '', item: null });

  const fetchData = useCallback(async (table, filters = []) => {
    let query = supabase.from(table).select('*');
    filters.forEach(({ column, value }) => {
      query = query.eq(column, value);
    });

    const { data, error } = await query;
    if (error) {
      showSnackbar(`Error fetching ${table}: ${error.message}`, 'error');
      return [];
    }
    return data;
  }, []);

  useEffect(() => {
    fetchData('pipelines').then(setPipelines);
    fetchData('lead_sources').then(setLeadSources);
  }, [fetchData]);

  useEffect(() => {
    if (currentPipeline) {
      fetchData('pipeline_stages', [{ column: 'pipeline_id', value: currentPipeline.pipeline_id }]).then(setStages);
    }
  }, [currentPipeline, fetchData]);

  useEffect(() => {
    if (currentStage) {
      fetchData('pipeline_fields', [{ column: 'stage_id', value: currentStage.stage_id }]).then(setFields);
    }
  }, [currentStage, fetchData]);

  const handleOpenDialog = (type, item = null) => {
    setDialogType(type);
    setFormData({
      name: item?.name || item?.pipeline_name || item?.stage_name || item?.field_name || item?.lead_source || '',
      type: item?.type || item?.field_type || 'textfield',
      district: item?.district || '',
      state: item?.state || '',
    });
    setOpenDialog(true);

    if (type === 'pipeline') {
      setCurrentPipeline(item);
    } else if (type === 'stage') {
      setCurrentStage(item);
    } else if (type === 'field') {
      setCurrentField(item);
    } else if (type === 'leadsource') {
      setCurrentLeadSource(item);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({ name: '', type: 'textfield', district: '', state: '' });
  };

  const handleFormSubmit = async () => {
    const submitFunctions = {
      pipeline: handlePipelineSubmit,
      stage: handleStageSubmit,
      field: handleFieldSubmit,
      leadsource: handleLeadSourceSubmit,
    };

    const result = await submitFunctions[dialogType]();

    if (result.error) {
      showSnackbar(`Error: ${result.error.message}`, 'error');
    } else {
      showSnackbar(`${dialogType} ${currentPipeline || currentStage || currentField || currentLeadSource ? 'updated' : 'added'} successfully`, 'success');
      handleCloseDialog();
      if (dialogType === 'pipeline') fetchData('pipelines').then(setPipelines);
      if (dialogType === 'stage' && currentPipeline) fetchData('pipeline_stages', [{ column: 'pipeline_id', value: currentPipeline.pipeline_id }]).then(setStages);
      if (dialogType === 'field' && currentStage) fetchData('pipeline_fields', [{ column: 'stage_id', value: currentStage.stage_id }]).then(setFields);
      if (dialogType === 'leadsource') fetchData('lead_sources').then(setLeadSources);
    }
  };

  const handlePipelineSubmit = async () => {
    const { pipeline_id } = currentPipeline || {};
    return pipeline_id
      ? await supabase.from('pipelines').update({ pipeline_name: formData.name }).eq('pipeline_id', pipeline_id)
      : await supabase.from('pipelines').insert({ pipeline_name: formData.name });
  };

  const handleStageSubmit = async () => {
    const { stage_id } = currentStage || {};
    return stage_id
      ? await supabase.from('pipeline_stages').update({ stage_name: formData.name }).eq('stage_id', stage_id)
      : await supabase.from('pipeline_stages').insert({ stage_name: formData.name, pipeline_id: currentPipeline.pipeline_id });
  };

  const handleFieldSubmit = async () => {
    const { field_id } = currentField || {};
    return field_id
      ? await supabase.from('pipeline_fields').update({ field_name: formData.name, field_type: formData.type }).eq('field_id', field_id)
      : await supabase.from('pipeline_fields').insert({ field_name: formData.name, field_type: formData.type, stage_id: currentStage.stage_id });
  };

  const handleLeadSourceSubmit = async () => {
    const { lead_source } = currentLeadSource || {};
    return lead_source
      ? await supabase.from('lead_sources').update({ lead_source: formData.name, district: formData.district, state: formData.state }).eq('lead_source', lead_source)
      : await supabase.from('lead_sources').insert({ lead_source: formData.name, district: formData.district, state: formData.state });
  };

  const handleDelete = (type, item) => {
    setConfirmDialog({ open: true, type, item });
  };

  const confirmDelete = async () => {
    const { type, item } = confirmDialog;
    const deleteOperations = {
      pipeline: { table: 'pipelines', key: 'pipeline_id', refresh: () => fetchData('pipelines').then(setPipelines) },
      stage: { table: 'pipeline_stages', key: 'stage_id', refresh: () => fetchData('pipeline_stages', [{ column: 'pipeline_id', value: currentPipeline.pipeline_id }]).then(setStages) },
      field: { table: 'pipeline_fields', key: 'field_id', refresh: () => fetchData('pipeline_fields', [{ column: 'stage_id', value: currentStage.stage_id }]).then(setFields) },
      leadsource: { table: 'lead_sources', key: 'lead_source', refresh: () => fetchData('lead_sources').then(setLeadSources) },
    };

    const { table, key, refresh } = deleteOperations[type];
    const result = await supabase.from(table).delete().eq(key, item[key]);

    if (result.error) {
      showSnackbar(`Error deleting ${type}: ${result.error.message}`, 'error');
    } else {
      showSnackbar(`${type} deleted successfully`, 'success');
      refresh();
      setConfirmDialog({ open: false, type: '', item: null });
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const getIconForFieldType = (type) => {
    switch (type) {
      case 'textfield':
        return <TextFields />;
      case 'checkbox':
        return <CheckBox />;
      case 'file':
        return <AttachFile />;
      case 'date':
        return <Event />;
      default:
        return null;
    }
  };

  const renderPipelineCard = (pipeline) => (
    <StyledPaper key={pipeline.pipeline_id}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight="bold" onClick={() => setCurrentPipeline(pipeline)}>
          {pipeline.pipeline_name}
        </Typography>
        <Box>
          <Tooltip title="Delete Pipeline">
            <IconButton onClick={(e) => { e.stopPropagation(); handleDelete('pipeline', pipeline); }} size="small">
              <Delete />
            </IconButton>
          </Tooltip>
          <Tooltip title="View Stages">
            <IconButton onClick={(e) => { e.stopPropagation(); setCurrentPipeline(pipeline); }} size="small">
              <ArrowForward />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </StyledPaper>
  );

  const renderStageListItem = (stage) => (
    <StyledListItem key={stage.stage_id}>
      <ListItemText
        primary={
          <Typography variant="subtitle1" fontWeight="bold" onClick={() => setCurrentStage(currentStage?.stage_id === stage.stage_id ? null : stage)}>
            {stage.stage_name}
          </Typography>
        }
      />
      <ListItemSecondaryAction>
        <Tooltip title="Delete Stage">
          <StyledIconButton onClick={(e) => { e.stopPropagation(); handleDelete('stage', stage); }} size="small">
            <Delete />
          </StyledIconButton>
        </Tooltip>
        <Tooltip title="View Fields">
          <StyledIconButton onClick={(e) => { e.stopPropagation(); setCurrentStage(stage); }} size="small">
            <ArrowForward />
          </StyledIconButton>
        </Tooltip>
      </ListItemSecondaryAction>
    </StyledListItem>
  );

  const renderFieldListItem = (field) => (
    <StyledListItem key={field.field_id}>
      <ListItemText
        primary={
          <Box display="flex" alignItems="center">
            {getIconForFieldType(field.field_type)}
            <Typography variant="body1" fontWeight="bold" ml={1}>{field.field_name}</Typography>
          </Box>
        }
      />
      <ListItemSecondaryAction>
        <Tooltip title="Edit Field">
          <StyledIconButton onClick={(e) => { e.stopPropagation(); handleOpenDialog('field', field); }} size="small">
            <Edit />
          </StyledIconButton>
        </Tooltip>
        <Tooltip title="Delete Field">
          <StyledIconButton onClick={(e) => { e.stopPropagation(); handleDelete('field', field); }} size="small">
            <Delete />
          </StyledIconButton>
        </Tooltip>
      </ListItemSecondaryAction>
    </StyledListItem>
  );

  const renderLeadSourceListItem = (leadSource) => (
    <StyledListItem key={leadSource.lead_source}>
      <ListItemText
        primary={
          <Box display="flex" alignItems="center">
            <Typography variant="body1" fontWeight="bold" ml={1}>{leadSource.lead_source}</Typography>
            {leadSource.lead_source === 'Krishi Bahavan' && (
              <>
                <Typography variant="body2" color="textSecondary" ml={2}>
                  {leadSource.district}, {leadSource.state}
                </Typography>
              </>
            )}
          </Box>
        }
      />
      <ListItemSecondaryAction>
        <Tooltip title="Edit Lead Source">
          <StyledIconButton onClick={(e) => { e.stopPropagation(); handleOpenDialog('leadsource', leadSource); }} size="small">
            <Edit />
          </StyledIconButton>
        </Tooltip>
        <Tooltip title="Delete Lead Source">
          <StyledIconButton onClick={(e) => { e.stopPropagation(); handleDelete('leadsource', leadSource); }} size="small">
            <Delete />
          </StyledIconButton>
        </Tooltip>
      </ListItemSecondaryAction>
    </StyledListItem>
  );

  return (
    <div className="flex flex-col min-h-screen bg-white ">
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-7">
            <div className="flex items-center space-x-4">
              <AccountTreeIcon className="text-blue-500" style={{ fontSize: '1.75rem' }} />
              <h1 className="text-xl font-semibold ml-2">Pipeline and Lead Source Management</h1>
            </div>
          </div>
        </div>
      </div>

      <Container maxWidth="lg" className="flex-grow p-4 space-x-4 overflow-x-auto">
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <StyledPaper>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
                  <Link underline="hover" color="inherit" onClick={() => { setCurrentStage(null); setCurrentPipeline(null); }}>
                    Pipelines
                  </Link>
                  {currentPipeline && (
                    <Link underline="hover" color="inherit" onClick={() => setCurrentStage(null)}>
                      {currentPipeline.pipeline_name}
                    </Link>
                  )}
                  {currentStage && <Link underline="hover" color="inherit">{currentStage.stage_name}</Link>}
                </Breadcrumbs>
              </Box>
              {!currentPipeline && (
                <>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      Pipelines
                    </Typography>
                    <Tooltip title="Add new pipeline">
                      <StyledButton
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => handleOpenDialog('pipeline')}
                        color="primary"
                      >
                        Add Pipeline
                      </StyledButton>
                    </Tooltip>
                  </Box>
                  <List>
                    {pipelines.map((pipeline) => renderPipelineCard(pipeline))}
                  </List>
                </>
              )}
              {currentPipeline && !currentStage && (
                <>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      Stages of {currentPipeline.pipeline_name}
                    </Typography>
                    <Tooltip title="Back to Pipelines">
                      <StyledIconButton onClick={() => setCurrentPipeline(null)} size="small">
                        <ArrowBack />
                      </StyledIconButton>
                    </Tooltip>
                  </Box>
                  <List>
                    {stages.map((stage) => renderStageListItem(stage))}
                  </List>
                  <Box mt={2}>
                    <StyledButton
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => handleOpenDialog('stage')}
                      color="primary"
                    >
                      Add Stage
                    </StyledButton>
                  </Box>
                </>
              )}
              {currentStage && (
                <>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      Fields of {currentStage.stage_name}
                    </Typography>
                    <Tooltip title="Back to Stages">
                      <StyledIconButton onClick={() => setCurrentStage(null)} size="small">
                        <ArrowBack />
                      </StyledIconButton>
                    </Tooltip>
                  </Box>
                  <List>
                    {fields.map((field) => renderFieldListItem(field))}
                  </List>
                  <Box mt={2}>
                    <StyledButton
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => handleOpenDialog('field')}
                      color="primary"
                    >
                      Add Field
                    </StyledButton>
                  </Box>
                </>
              )}
            </StyledPaper>
          </Grid>

          <Grid item xs={12} md={6}>
            <StyledPaper>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">Lead Sources</Typography>
                <Tooltip title="Add new lead source">
                  <IconButton
                    className="p-2"
                    onClick={() => handleOpenDialog('leadsource')}
                    style={{ backgroundColor: '#e3f2fd', color: '#1e88e5', borderRadius: '12px' }}
                  >
                    <Add style={{ fontSize: '1.75rem' }} />
                  </IconButton>
                </Tooltip>
              </Box>
              <List>
                {leadSources.map((leadSource) => renderLeadSourceListItem(leadSource))}
              </List>
            </StyledPaper>
          </Grid>
        </Grid>

        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle>{(currentPipeline && dialogType === 'pipeline') || (currentStage && dialogType === 'stage') || (currentField && dialogType === 'field') || (currentLeadSource && dialogType === 'leadsource') ? 'Edit' : 'Add'} {dialogType}</DialogTitle>
          <DialogContent>
            <TextField
              label="Name"
              fullWidth
              margin="normal"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            />
            {dialogType === 'field' && (
              <FormControl fullWidth margin="normal">
                
                <Select
                  labelId="field-type-label"
                  value={formData.type}
                  onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
                >
                  <MenuItem value="textfield">Textfield</MenuItem>
                  <MenuItem value="checkbox">Checkbox</MenuItem>
                  <MenuItem value="file">File</MenuItem>
                  <MenuItem value="date">Date</MenuItem>
                </Select>
              </FormControl>
            )}
            {dialogType === 'leadsource' && (
              <>
                <TextField
                  label="District"
                  fullWidth
                  margin="normal"
                  value={formData.district}
                  onChange={(e) => setFormData((prev) => ({ ...prev, district: e.target.value }))}
                />
                <TextField
                  label="State"
                  fullWidth
                  margin="normal"
                  value={formData.state}
                  onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
                />
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleFormSubmit}  color="primary">
              {(currentPipeline && dialogType === 'pipeline') || (currentStage && dialogType === 'stage') || (currentField && dialogType === 'field') || (currentLeadSource && dialogType === 'leadsource') ? 'Update' : 'Submit'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, type: '', item: null })}>
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to delete this {confirmDialog.type}?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDialog({ open: false, type: '', item: null })}>Cancel</Button>
            <Button onClick={confirmDelete}  color="primary">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </div>
  );
};

export default Pipelines;

