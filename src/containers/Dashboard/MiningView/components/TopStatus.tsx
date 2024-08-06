import { useEffect } from 'react';
import { Typography } from '@mui/material';
import useAppStateStore from '../../../../store/appStateStore';
import { useAppStatusStore } from '../../../../store/useAppStatusStore.ts';
function TopStatus() {
    const { topStatus, setTopStatus } = useAppStateStore((state) => ({
        topStatus: state.topStatus,
        setTopStatus: state.setTopStatus,
    }));

    const isMining = useAppStatusStore((s) => s.cpu?.is_mining);

    useEffect(() => {
        if (isMining) {
            setTopStatus('Mining');
        } else {
            setTopStatus('Not mining');
        }
    }, [isMining]);

    return (
        <Typography variant="h5" textTransform="uppercase">
            {topStatus}
        </Typography>
    );
}

export default TopStatus;
