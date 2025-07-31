import { isAddress } from 'ethers';

import { useWalletStore } from '@app/store';
import { Typography } from '@app/components/elements/Typography.tsx';
import { SettingsGroupTitle } from '@app/containers/floating/Settings/components/SettingsGroup.styles.ts';
import AddressEditor from '@app/containers/floating/Settings/sections/wallet/components/AddressEditor.tsx';

import { ETHAddressWrapper } from './styles.ts';
import { convertEthAddressToTariAddress } from '@app/store/actions/bridgeApiActions.ts';
import { useExchangeStore } from '@app/store/useExchangeStore.ts';

export default function ETHAddress() {
    const currentExchangeId = useExchangeStore((s) => s.currentExchangeMinerId);
    // should only exist in case mining to exchange with wxtm_mode enabled
    const ethAddress = useWalletStore((state) => state.getETHAddressOfCurrentExchange());

    const validationRules = {
        validate: (value: string) => {
            const isValid = isAddress(value);
            return isValid || 'Invalid address';
        },
    };

    async function handleSubmit(address: string) {
        await convertEthAddressToTariAddress(address, currentExchangeId);
    }

    return ethAddress?.length ? (
        <ETHAddressWrapper>
            <SettingsGroupTitle>
                <Typography variant="h6">{`Exchange ETH Address`}</Typography>
            </SettingsGroupTitle>
            <AddressEditor initialAddress={ethAddress} onApply={handleSubmit} rules={validationRules} isWXTM={true} />
        </ETHAddressWrapper>
    ) : null;
}
