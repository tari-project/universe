import { TappletConfig } from '@app/types/ootle/tapplet';
import { useCallback, useEffect } from 'react';
import { useTappletProviderStore } from '@app/store/useTappletProviderStore';
import { Box, IconButton, Typography } from '@mui/material';
import { Tapplet } from './Tapplet';
import { MdClose } from 'react-icons/md';
import { useTappletsStore } from '@app/store/useTappletsStore';
import { HeaderContainer } from './styles';
import { useAppStateStore } from '@app/store/appStateStore';

const TAPPLET_CONFIG_FILE = 'tapplet.config.json';

export default function ActiveTappletView() {
    const tappProvider = useTappletProviderStore((s) => s.tappletProvider);
    const setTappletProvider = useTappletProviderStore((s) => s.setTappletProvider);
    const tapplet = useTappletsStore((s) => s.activeTapplet);
    const setActiveTapp = useTappletsStore((s) => s.setActiveTapp);
    const setError = useAppStateStore((s) => s.setError);

    const fetchTappConfig = useCallback(async () => {
        try {
            if (!tapplet) return;
            const resp = await fetch(`${tapplet?.source}/${TAPPLET_CONFIG_FILE}`);
            if (!resp.ok) return;
            const config: TappletConfig = await resp.json();
            if (!config) return;
            if (!tappProvider && tapplet) {
                // assign permissions
                tapplet.permissions = config.permissions;
                tapplet.supportedChain = config.supportedChain;
                tapplet.version = config.version;
                console.info('Dev Tapplet provider not found - setting new one: ', tapplet);
                setTappletProvider(config.packageName, tapplet);
                setActiveTapp(tapplet);
            }
            if (!config.permissions) {
                // TODO error translation
                setError('Dev Tapplet config file not found');
                console.error('Dev Tapplet config file not found');
            }
        } catch (e) {
            setError(e as string);
            console.error(e);
        }
    }, [setActiveTapp, setError, setTappletProvider, tappProvider, tapplet]);

    useEffect(() => {
        fetchTappConfig();
    }, [fetchTappConfig]);

    return (
        <>
            <HeaderContainer>
                <IconButton onClick={() => setActiveTapp(undefined)}>
                    <MdClose size={18} />
                </IconButton>
                <Typography variant="h6">
                    {tapplet ? `${tapplet.display_name} v${tapplet.version} ` : 'Unknown tapplet'}
                </Typography>
            </HeaderContainer>
            <Box height="100%" width="100%">
                {tapplet && <Tapplet source={tapplet?.source} provider={tappProvider} />}
            </Box>
        </>
    );
}
