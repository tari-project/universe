import { useEffect } from 'react';
import { Typography } from '@mui/material';
import useAppStateStore from '../../../../store/appStateStore';

import { useCPUStatusStore } from '../../../../store/useCPUStatusStore.ts';
function TopStatus() {
    const { topStatus, setTopStatus } = useAppStateStore((state) => ({
        topStatus: state.topStatus,
        setTopStatus: state.setTopStatus,
    }));

    const isMining = useCPUStatusStore((s) => s.is_mining);

    useEffect(() => {
        if (isMining) {
            setTopStatus('Mining');
        } else {
            setTopStatus('Not mining');
        }
    }, [isMining, setTopStatus]);

    return (
        <Typography variant="h5" textTransform="uppercase">
            {topStatus}
        </Typography>
    );
}

export default TopStatus;
