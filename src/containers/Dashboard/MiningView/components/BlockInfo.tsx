import { Stack, Typography } from '@mui/material';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { useTranslation } from 'react-i18next';

function BlockInfo() {
    const { t } = useTranslation('mining-view', { useSuspense: false });
    const displayBlockHeight = useMiningStore((s) => s.displayBlockHeight);

    return (
        <Stack direction="row" spacing={2}>
            {displayBlockHeight ? (
                <Stack alignItems="flex-end">
                    <Typography variant="h6">#{displayBlockHeight}</Typography>
                    <Typography variant="body2">{t('floor')}</Typography>
                </Stack>
            ) : null}
        </Stack>
    );
}

export default BlockInfo;
