import { SettingsGroup, SettingsGroupContent, SettingsGroupWrapper } from '../../components/SettingsGroup.styles';

import { Typography } from '@app/components/elements/Typography';

import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useState } from 'react';
import { useTappletProviderStore } from '@app/store/useTappletProviderStore';

import { Stack } from '@app/components/elements/Stack';
import { CardContainer, ConnectionIcon } from '../../components/Settings.styles';
import { CardComponent } from '../../components/Card.component';
import { AccountInfo, OotleAccount } from './types';
import SelectAccount from './SelectOotleAccount';

const OotleWalletBalance = () => {
    const { t } = useTranslation(['settings', 'ootle'], { useSuspense: false });
    const [account, setAccount] = useState<OotleAccount>();
    const [accountsList, setAccountsList] = useState<AccountInfo[]>([]);

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
                // TODO debug why `address` is undefined
                const list = await tappProvider.getAccountsList();
                // TODO refactor types
                setAccountsList(list.accounts as unknown as AccountInfo[]);
                const acc = (await tappProvider.getAccount()) as OotleAccount;
                console.info('TAPP ACCOUNT -> ', acc);
                setAccount(acc);
            }
        } catch (error) {
            console.error(error);
        }
        console.info('TAPP ACCOUNT', account);
    }, [account, initTappletProvider, tappProvider]);

    async function handleOnSubmit() {
        return;
    }

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
                    <SelectAccount
                        onSubmit={handleOnSubmit}
                        accountsList={accountsList}
                        currentAccount={accountsList[0] ?? undefined}
                    />
                </SettingsGroup>
            </SettingsGroupWrapper>
        </>
    );
};

export default OotleWalletBalance;
