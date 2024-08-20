import { Stack, Typography, IconButton } from '@mui/material';
import { CgArrowsExpandRight, CgCompressRight } from 'react-icons/cg';
import SettingsDialog from './Settings/Settings.tsx';
import { useUIStore } from '../../../store/useUIStore.ts';

function Heading() {
    return (
        <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h3">Tari Universe</Typography>
            <Stack direction="row" spacing={0.5}>
                <SettingsDialog />
            </Stack>
        </Stack>
    );
}

export default Heading;
