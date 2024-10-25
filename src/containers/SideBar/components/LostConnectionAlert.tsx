import { IoAlertCircleSharp } from 'react-icons/io5';
import { Stack } from '@app/components/elements/Stack';
import { Typography } from '@app/components/elements/Typography';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { useAppStateStore } from '@app/store/appStateStore';
// import { useMiningStore } from '@app/store/useMiningStore';

const LostConnectionIcon = styled(IoAlertCircleSharp)(({ theme }) => ({
    color: theme.palette.warning.main,
}));

const LostConnectionAlert = () => {
    const { t } = useTranslation('sidebar', { useSuspense: false });
    // const isConnectedToTari = useMiningStore((s) => s.base_node?.is_connected);
    // Hotfix for now
    const isConnectedToTari = true;
    const isSettingUp = useAppStateStore((s) => s.isSettingUp);

    return !isConnectedToTari && !isSettingUp ? (
        <Stack direction="row" justifyContent="space-between" alignItems="center">
            <LostConnectionIcon size={20} />
            <Typography variant="p">{t('lost-connection')}</Typography>
        </Stack>
    ) : (
        <></>
    );
};

export default LostConnectionAlert;
