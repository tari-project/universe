import AddressEditor from '@app/containers/floating/Settings/sections/wallet/components/AddressEditor.tsx';
import { setExternalTariAddress } from '@app/store/actions/walletStoreActions.ts';
import { useWalletStore } from '@app/store';
import { useFetchExchangeBranding } from '@app/hooks/exchanges/fetchExchangeContent.ts';
import { useValidateTariAddress } from '@app/hooks/wallet/useValidate.ts';

export default function BaseAddress() {
    const { data } = useFetchExchangeBranding();
    const { validateAddress } = useValidateTariAddress();
    const walletType = useWalletStore((state) => state.tari_address_type);
    const walletAddress = useWalletStore((state) => state.tari_address_base58);
    const isWXTM = data?.wxtm_mode && walletType.toString() === 'External'; //TariAddressType.External;
    const validationRules = {
        validate: async (value) => {
            const isValid = await validateAddress(value);
            return isValid || 'Invalid address format';
        },
    };

    return (
        <AddressEditor
            initialAddress={walletAddress}
            onApply={setExternalTariAddress}
            rules={validationRules}
            isWXTM={!!isWXTM}
        />
    );
}
