import { Box, Alert, IconButton } from '@mui/material';
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

  if (error === '') {
    return null;
  }

  return (
    <Alert
      onClose={handleClose}
      severity="error"
      variant="filled"
      sx={{
        position: 'fixed',
        bottom: '10px',
        left: '10px',
        width: 'calc(100% - 20px)',
        zIndex: 9999,
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
  );
}

export default ErrorSnackbar;
