import { IoAlertCircleSharp } from 'react-icons/io5';
import { Stack } from '@app/components/elements/Stack';
import { Typography } from '@app/components/elements/Typography';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';

const LostConnectionIcon = styled(IoAlertCircleSharp)(({ theme }) => ({
    color: theme.palette.warning.main,
}));

export const OrphanChainAlert = () => {
    const [isOrphanChain, setIsOrphanChain] = useState(false);
    const { t } = useTranslation('settings', { useSuspense: false });

    useEffect(() => {
        const unlistenPromise = listen<boolean>('is_stuck', (event) => {
            setIsOrphanChain(event.payload);
        });
        return () => {
            unlistenPromise.then((unlisten) => unlisten());
        };
    }, [setIsOrphanChain]);

    return isOrphanChain ? (
        <Stack direction="row" justifyContent="space-between" alignItems="center">
            <LostConnectionIcon size={20} />
            <Typography variant="p">{t('is-on-orphan-chain')}</Typography>
        </Stack>
    ) : (
        <></>
    );
};

export default OrphanChainAlert;
