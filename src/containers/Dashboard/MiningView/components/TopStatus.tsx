import { Typography } from '@mui/material';
import { useShallow } from 'zustand/react/shallow';

import { useCPUStatusStore } from '@app/store/useCPUStatusStore.ts';

function TopStatus() {
    const isMining = useCPUStatusStore(useShallow((s) => s.is_mining));
    return (
        <Typography variant="h5" textTransform="uppercase">
            {isMining ? 'Mining' : 'Not Mining'}
        </Typography>
    );
}

export default TopStatus;
