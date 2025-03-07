import { IoAlertCircleSharp } from 'react-icons/io5';
import { Stack } from '@app/components/elements/Stack';
import { Typography } from '@app/components/elements/Typography';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { useAppStateStore } from '@app/store/appStateStore';

const LostConnectionIcon = styled(IoAlertCircleSharp)(({ theme }) => ({
    color: theme.palette.warning.main,
}));

const LostConnectionAlert = () => {
    const { t } = useTranslation('sidebar', { useSuspense: false });
    // const isConnectedToTari = useMiningStore((s) => s.base_node?.is_connected);
    // Hotfix for now
    const isConnectedToTari = true;
    const isSettingUp = useAppStateStore((s) => !s.setupComplete);

    return !isConnectedToTari && !isSettingUp ? (
        <Stack direction="row" justifyContent="space-between" alignItems="center" style={{ padding: '0 6px' }} gap={6}>
            <LostConnectionIcon size={18} />
            <Typography variant="p">{t('lost-connection')}</Typography>
        </Stack>
    ) : null;
};

export default LostConnectionAlert;
