import { isAddress } from 'ethers';

import { useWalletStore } from '@app/store';
import { Typography } from '@app/components/elements/Typography.tsx';
import { SettingsGroupTitle } from '@app/containers/floating/Settings/components/SettingsGroup.styles.ts';
import AddressEditor from '@app/containers/floating/Settings/sections/wallet/components/AddressEditor.tsx';

import { ETHAddressWrapper } from './styles.ts';
import { convertEthAddressToTariAddress } from '@app/store/actions/bridgeApiActions.ts';
import { invoke } from '@tauri-apps/api/core';
import { addToast } from '@app/components/ToastStack/useToastStore.tsx';
import { ExchangeMiner } from '@app/types/exchange.ts';
import { useFetchExchangeBranding } from '@app/hooks/exchanges/fetchExchangeContent.ts';
import { useTranslation } from 'react-i18next';

export default function ETHAddress() {
    const { t } = useTranslation('wallet');
    const { data } = useFetchExchangeBranding();
    // should only exist in case mining to exchange with wxtm_mode enabled
    const ethAddress = useWalletStore((state) => state.getETHAddressOfCurrentExchange());

    const validationRules = {
        validate: (value: string) => {
            const isValid = isAddress(value);
            return isValid || 'Invalid address';
        },
    };

    async function handleSubmit(address: string) {
        if (!data) return;
        const exchangeMiner: ExchangeMiner = {
            id: data.id,
            slug: data.slug,
            name: data.name,
        };
        const newEncoded = await convertEthAddressToTariAddress(address, exchangeMiner.id);
        await invoke('select_exchange_miner', { exchangeMiner, miningAddress: newEncoded });
        addToast({
            type: 'success',
            title: 'Address updated',
            text: 'Your converted Tari Address has also been updated',
        });
    }

    return ethAddress?.length ? (
        <ETHAddressWrapper>
            <SettingsGroupTitle>
                <Typography variant="h6">{t('xc.address-eth')}</Typography>
            </SettingsGroupTitle>
            <AddressEditor initialAddress={ethAddress} onApply={handleSubmit} rules={validationRules} isWXTM={true} />
        </ETHAddressWrapper>
    ) : null;
}
