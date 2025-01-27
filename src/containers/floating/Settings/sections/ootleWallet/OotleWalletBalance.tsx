import {
    SettingsGroup,
    SettingsGroupAction,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles';
import { useAppConfigStore } from '@app/store/useAppConfigStore';

import { Typography } from '@app/components/elements/Typography';

import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useState } from 'react';
import { useTappletProviderStore } from '@app/store/useTappletProviderStore';
import { Account } from '@tari-project/tarijs';
import { Stack } from '@app/components/elements/Stack';
import { CardContainer, ConnectionIcon } from '../../components/Settings.styles';
import { CardComponent } from '../../components/Card.component';

const OotleWalletBalance = () => {
    const { t } = useTranslation(['settings', 'ootle'], { useSuspense: false });
    const [account, setAccount] = useState<Account>();

    const tappProvider = useTappletProviderStore((s) => s.tappletProvider);
    const isTappProviderInitialized = useTappletProviderStore((s) => s.isInitialized);
    const initTappletProvider = useTappletProviderStore((s) => s.initTappletProvider);

    const refreshAccount = useCallback(async () => {
        console.info('TAPP PROVIDER', tappProvider);
        try {
            if (!tappProvider) {
                console.info('TAPP PROVIDER INIT');
                await initTappletProvider();
                return;
            }
            if (!account) {
                const acc = await tappProvider.getAccount();
                setAccount(acc);
            }
        } catch (error) {
            console.error(error);
        }
        console.info('TAPP ACCOUNT', account);
    }, [account, initTappletProvider, tappProvider]);

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
                        <Typography>{t('Tari Ootle Wallet public key')}</Typography>
                        <Typography variant="h6">{account?.public_key}</Typography>
                    </SettingsGroupContent>
                </SettingsGroup>
                <SettingsGroup>
                    <SettingsGroupContent>
                        <Stack>
                            <CardContainer>
                                {Object.entries(account?.resources || []).map(([key, value]) => (
                                    <CardComponent
                                        key={key}
                                        heading={value.type}
                                        labels={[
                                            {
                                                labelText: value.resource_address,
                                                labelValue: value.balance || t('unknown', { ns: 'common' }),
                                            },
                                        ]}
                                    />
                                ))}
                            </CardContainer>
                        </Stack>
                    </SettingsGroupContent>
                </SettingsGroup>
            </SettingsGroupWrapper>
        </>
    );
};

export default OotleWalletBalance;
