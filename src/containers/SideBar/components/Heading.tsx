import SettingsDialog from './Settings/Settings.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';

function Heading() {
    return (
        <Stack direction="row" justifyContent="space-between">
            <Typography variant="h3">Tari Universe</Typography>
            <Stack>
                <SettingsDialog />
            </Stack>
        </Stack>
    );
}

export default Heading;
