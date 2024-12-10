import { DevTapplet, InstalledTappletWithAssets, ActiveTapplet, TappletConfig } from '@app/types/ootle/tapplet';
import { useEffect, useState } from 'react';
import { useTappletProviderStore } from '@app/store/useTappletProviderStore';
import { Box, IconButton, Typography } from '@mui/material';
import { Tapplet } from './Tapplet';
import { MdClose } from 'react-icons/md';
import { useTappletsStore } from '@app/store/useTappletsStore';
import { SettingsGroupTitle } from '@app/containers/floating/Settings/components/SettingsGroup.styles';

export default function ActiveDevTapplet() {
    const { setActiveTapp } = useTappletsStore();
    const [tapplet, setTapplet] = useState<ActiveTapplet>();
    const tappProvider = useTappletProviderStore((s) => s.tappletProvider);
    const setTappProvider = useTappletProviderStore((s) => s.setTappletProvider);
    const getActiveTapp = useTappletsStore((s) => s.getActiveTapp);

    useEffect(() => {
        if (!tapplet) {
            const tapp = getActiveTapp();
            if (tapp) setTapplet(tapp);
        }
    }, [tapplet, getActiveTapp, setTapplet]);

    useEffect(() => {
        const fetchTappletConfig = async () => {
            console.log('[active dev tapp] fetch tapp config');
            try {
                //TODO
                // const config: TappletConfig = await (await fetch(`${devTapplet?.endpoint}/tapplet.config.json`)).json(); //TODO add const as path to config
                const config: TappletConfig = {
                    packageName: 'tarifaucet-tapplet',
                    version: '1.0.4',
                    supportedChain: ['MAINNET', 'STAGENET', 'NEXTNET'],
                    permissions: {
                        requiredPermissions: [
                            'TariPermissionNftGetOwnershipProof',
                            'TariPermissionAccountBalance',
                            'TariPermissionAccountInfo',
                            'TariPermissionAccountList',
                            'TariPermissionKeyList',
                            'TariPermissionTransactionGet',
                            'TariPermissionTransactionSend',
                            'TariPermissionGetNft',
                            'TariPermissionTransactionsGet',
                            'TariPermissionSubstatesRead',
                            'TariPermissionTemplatesRead',
                        ],
                        optionalPermissions: [],
                    },
                };
                if (config) {
                    if (!tappProvider && tapplet) {
                        // TODO set error
                        console.error('Dev Tapplet provider not found');
                        setTappProvider(config.packageName, tapplet);
                    }
                    if (!config?.permissions) {
                        // TODO set error
                        console.error('Dev Tapplet config file not found');
                    }
                }
            } catch (e) {
                console.error(e);
            }
        };

        if (tapplet) {
            fetchTappletConfig();
        }
    }, []);

    return (
        <>
            <SettingsGroupTitle>
                <Typography variant="h6">{tapplet?.display_name ?? 'Unknown tapplet name'}</Typography>
                <IconButton aria-label="launch" style={{ marginRight: 10 }} onClick={() => setActiveTapp(undefined)}>
                    <MdClose color="primary" />
                </IconButton>
            </SettingsGroupTitle>
            <Box height="100%" width="100%">
                {tapplet && tappProvider && <Tapplet source={tapplet?.source} provider={tappProvider} />}
            </Box>
        </>
    );
}
