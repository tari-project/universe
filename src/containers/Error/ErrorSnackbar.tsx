import { IoClose } from 'react-icons/io5';
import useAppStateStore from '../../store/appStateStore';

function ErrorSnackbar() {
    const { error, setError } = useAppStateStore((state) => ({
        error: state.error,
        setError: state.setError,
    }));

    const handleClose = (_event: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }

        setError('');
    };

    return (
        <div
            style={{ position: 'absolute', height: 0 }}
            // open={error !== ''}
            // autoHideDuration={20000}
            // onClose={handleClose}
            // anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
            <div
            // onClose={handleClose}
            // severity="error"
            // variant="filled"
            // sx={{
            //     width: '100%',
            // }}
            // action={
            //     <button aria-label="close" color="inherit" size="small" onClick={handleClose}>
            //         <IoClose font-size="inherit" style={{ color: 'white' }} />
            //     </button>
            // }
            >
                <div
                    style={{
                        minWidth: '238px',
                    }}
                >
                    {error}
                </div>
            </div>
        </div>
    );
}

export default ErrorSnackbar;
