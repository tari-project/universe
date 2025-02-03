import { SettingsGroup, SettingsGroupContent, SettingsGroupWrapper } from '../../components/SettingsGroup.styles';

import { Typography } from '@app/components/elements/Typography';

import { useTranslation } from 'react-i18next';
import { useCallback, useEffect } from 'react';
import { useTappletProviderStore } from '@app/store/useTappletProviderStore';

import { Stack } from '@app/components/elements/Stack';
import { CardContainer, ConnectionIcon } from '../../components/Settings.styles';
import { CardComponent } from '../../components/Card.component';
import SelectAccount from './SelectOotleAccount';
import { useOotleWalletStore } from '@app/store/useOotleWalletStore';

const OotleWalletBalance = () => {
    const { t } = useTranslation(['settings', 'ootle'], { useSuspense: false });

    const tappProvider = useTappletProviderStore((s) => s.tappletProvider);
    const isTappProviderInitialized = useTappletProviderStore((s) => s.isInitialized);
    const initTappletProvider = useTappletProviderStore((s) => s.initTappletProvider);
    const ootleAccount = useOotleWalletStore((s) => s.ootleAccount);
    const ootleAccountsList = useOotleWalletStore((s) => s.ootleAccountsList);
    const getOotleAccountInfo = useOotleWalletStore((s) => s.getOotleAccountInfo);
    const getOotleAccountsList = useOotleWalletStore((s) => s.getOotleAccountsList);

    const refreshAccount = useCallback(async () => {
        console.info('TAPP PROVIDER', tappProvider);
        console.info('TAPP ACCOUNT', ootleAccount);
        try {
            if (!tappProvider) {
                console.info('TAPP PROVIDER INIT');
                await initTappletProvider();
                return;
            }
            if (!ootleAccount) {
                console.info('TAPP ACCOUNT UPDATED-> ', ootleAccount);
                await getOotleAccountInfo();
            }
            if (!ootleAccountsList) {
                await getOotleAccountsList();
                console.info('TAPP ACCOUNT LIST UPDATED -> ', ootleAccountsList);
            }
        } catch (error) {
            console.error(error);
        }
    }, [tappProvider, ootleAccount, ootleAccountsList, initTappletProvider, getOotleAccountInfo, getOotleAccountsList]);

    useEffect(() => {
        refreshAccount();
    }, [refreshAccount]);

    return (
        <>
            <SettingsGroupWrapper>
                <SettingsGroup>
                    <SettingsGroupContent>
                        <Stack direction="row" justifyContent="right" alignItems="center">
                            <ConnectionIcon $isConnected={isTappProviderInitialized} size={20} />
                            <Typography variant="p">
                                {isTappProviderInitialized ? 'Provider initialized' : 'Provider not initialized'}
                            </Typography>
                        </Stack>
                        <Typography>{t('Tari Ootle Account')}</Typography>
                        <Typography variant="h6">{ootleAccount?.account_name}</Typography>
                        <Typography variant="h6">{ootleAccount?.address}</Typography>
                    </SettingsGroupContent>
                </SettingsGroup>
                <SettingsGroup>
                    <SettingsGroupContent>
                        <Stack>
                            <CardContainer>
                                {Object.entries(ootleAccount?.resources || []).map(([key, value]) => (
                                    <CardComponent
                                        key={key}
                                        heading={`${value.token_symbol} (${value.resource_address})`}
                                        labels={[
                                            {
                                                labelText: 'balance',
                                                labelValue: value.balance || t('unknown', { ns: 'common' }),
                                            },
                                        ]}
                                    />
                                ))}
                            </CardContainer>
                        </Stack>
                    </SettingsGroupContent>
                </SettingsGroup>
                <SettingsGroup>
                    <SelectAccount accountsList={ootleAccountsList} currentAccount={ootleAccount} />
                </SettingsGroup>
            </SettingsGroupWrapper>
        </>
    );
};

export default OotleWalletBalance;
