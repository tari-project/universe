import { ActiveTapplet, TappletConfig } from '@app/types/ootle/tapplet';
import { useCallback, useEffect, useState } from 'react';
import { useTappletProviderStore } from '@app/store/useTappletProviderStore';
import { Box, IconButton, Typography } from '@mui/material';
import { Tapplet } from './Tapplet';
import { MdClose } from 'react-icons/md';
import { useTappletsStore } from '@app/store/useTappletsStore';
import { HeaderContainer } from './styles';

export default function ActiveTappletView() {
    const [tapplet, setTapplet] = useState<ActiveTapplet>();
    const tappProvider = useTappletProviderStore((s) => s.tappletProvider);
    const setTappletProvider = useTappletProviderStore((s) => s.setTappletProvider);
    const activeTappletId = useTappletsStore((s) => s.activeTappletId);
    const getActiveTapp = useTappletsStore((s) => s.getActiveTapp);
    const setActiveTapp = useTappletsStore((s) => s.setActiveTapp);

    const fetchTappConfig = useCallback(async () => {
        console.log('[active dev tapp] fetch tapp config from tapp provider', tappProvider);
        console.log('[active dev tapp] fetch tapp config from tapp', tapplet);
        try {
            if (!tapplet) return;

            //TODO
            const config: TappletConfig = await (await fetch(`${tapplet?.source}/tapplet.config.json`)).json(); //TODO add const as path to config

            console.log('[active dev tapp] config ->', config);
            if (!config) return;
            if (!tappProvider && tapplet) {
                // assign permissions
                tapplet.permissions = config.permissions;
                tapplet.supportedChain = config.supportedChain;
                console.error('Dev Tapplet provider not found');
                setTappletProvider(config.packageName, tapplet);
            }
            if (!config?.permissions) {
                // TODO set error
                console.error('Dev Tapplet config file not found');
            }
        } catch (e) {
            console.error(e);
        }
    }, [setTappletProvider, tappProvider, tapplet]);

    const getActiveTapplet = useCallback(async () => {
        try {
            if (activeTappletId === tapplet?.tapplet_id) return;
            const tapp = getActiveTapp();
            setTapplet(tapp);
        } catch (e) {
            console.error(e);
        }
    }, [activeTappletId, tapplet?.tapplet_id, getActiveTapp]);

    useEffect(() => {
        getActiveTapplet();
        fetchTappConfig();
    }, [activeTappletId, fetchTappConfig, getActiveTapplet]);

    return (
        <>
            <HeaderContainer>
                <IconButton onClick={() => setActiveTapp(undefined)}>
                    <MdClose size={18} />
                </IconButton>
                <Typography variant="h6">{tapplet?.display_name ?? 'Unknown tapplet name'}</Typography>
            </HeaderContainer>
            <Box height="100%" width="100%">
                {tapplet && <Tapplet source={tapplet?.source} provider={tappProvider} />}
            </Box>
        </>
    );
}
