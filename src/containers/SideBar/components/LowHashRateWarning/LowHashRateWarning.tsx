import { IoWarningSharp } from 'react-icons/io5';
import { Stack } from '@app/components/elements/Stack';
import { Typography } from '@app/components/elements/Typography';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { useMiningStore } from '@app/store/useMiningStore';

const LowHashRateIcon = styled(IoWarningSharp)(({ theme }) => ({
    color: theme.palette.warning.main,
}));

export const LowHashRateWarning = () => {
    const { t } = useTranslation('settings', { useSuspense: false });
    const { hash_rate, is_mining } = useMiningStore((s) => s.cpu.mining);

    const showHashRateWarning = is_mining && hash_rate > 0 && hash_rate < 100;

    return showHashRateWarning ? (
        <Stack direction="row" justifyContent="space-between" alignItems="center">
            <LowHashRateIcon size={20} />
            <Typography variant="p">{t('low-hash-rate-warning')}</Typography>
        </Stack>
    ) : (
        <></>
    );
};
