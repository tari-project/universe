import { CTASArea, InputArea, WalletSettingsGrid } from '@app/containers/floating/Settings/sections/wallet/styles.ts';
import { Input } from '@app/components/elements/inputs/Input.tsx';
import { truncateMiddle } from '@app/utils';
import { CopyToClipboard } from '@app/containers/floating/Settings/sections/wallet/WalletAddressMarkup/WalletAddressMarkup.tsx';
import { useWalletStore } from '@app/store';

export default function ETHAddress() {
    // should only exist in case mining to exchange with wxtm_mode enabled
    const ethAddress = useWalletStore((state) => state.getETHAddressOfCurrentExchange());
    return ethAddress?.length ? (
        <>
            <WalletSettingsGrid>
                <InputArea>
                    <Input disabled value={truncateMiddle(ethAddress, 8)} style={{ fontSize: '12px' }} />
                </InputArea>
                <CTASArea>
                    <CopyToClipboard text={ethAddress} />
                </CTASArea>
            </WalletSettingsGrid>
        </>
    ) : null;
}
