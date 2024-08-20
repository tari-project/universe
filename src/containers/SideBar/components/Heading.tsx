import { Stack, Typography } from '@mui/material';
import SettingsDialog from './Settings';

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
