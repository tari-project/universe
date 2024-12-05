import { DevTapplet, TappletConfig } from '@app/types/ootle/tapplet';
import { useEffect, useState } from 'react';
import { useTappletProviderStore } from '@app/store/useTappletProviderStore';
import { Box } from '@mui/material';

export default function ActiveDevTapplet() {
    // const { state: devTapplet }: { state: DevTapplet } = useLocation();
    // TODO
    const devTapplet: DevTapplet = {
        id: '1',
        package_name: 'tarifaucet-tapplet',
        endpoint: '',
        display_name: 'tarifaucet tapplet',
        about_summary: '',
        about_description: '',
    };
    // const dispatch = useDispatch();
    const [isVerified, setIsVerified] = useState<boolean>(false);
    // const tappProviderId = getTappProviderId({ devTappletId: devTapplet.id });
    // const tappProvider = useSelector((state: RootState) => selectTappProviderById(state, tappProviderId));
    const tappProvider = useTappletProviderStore((s) => s.tappletProvider);
    const setTappProvider = useTappletProviderStore((s) => s.setTappletProvider);
    console.log('[active dev tapp] tapp', tappProvider);

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
                if (config?.packageName === devTapplet?.package_name) {
                    setIsVerified(true);

                    if (!tappProvider) {
                        // TODO set error
                        console.error('Dev Tapplet provider not found');
                        setTappProvider(config.packageName, {
                            endpoint: devTapplet.endpoint,
                            permissions: config.permissions,
                        });
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

        if (devTapplet?.endpoint) {
            fetchTappletConfig();
        }
    }, []);

    return (
        // <Box height="100%">
        //     {isVerified && tappProvider && <Tapplet source={devTapplet.endpoint} provider={tappProvider} />}
        // </Box>
        <Box height="100%">{'hihi'}</Box>
    );
}
