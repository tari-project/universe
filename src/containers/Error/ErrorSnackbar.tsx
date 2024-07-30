import { Box, Alert, IconButton, Snackbar } from '@mui/material';
import { IoClose } from 'react-icons/io5';
import useAppStateStore from '../../store/appStateStore';

function ErrorSnackbar() {
  const { error, setError } = useAppStateStore((state) => ({
    error: state.error,
    setError: state.setError,
  }));

  const handleClose = (
    _event: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === 'clickaway') {
      return;
    }

    setError('');
  };

  return (
    <Snackbar
      open={error !== ''}
      autoHideDuration={20000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        onClose={handleClose}
        severity="error"
        variant="filled"
        sx={{
          width: '100%',
        }}
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={handleClose}
          >
            <IoClose fontSize="inherit" style={{ color: 'white' }} />
          </IconButton>
        }
      >
        <Box
          style={{
            minWidth: '238px',
          }}
        >
          {error}
        </Box>
      </Alert>
    </Snackbar>
  );
}

export default ErrorSnackbar;
