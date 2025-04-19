import { useWalletStore } from '@app/store';
import { useCopyToClipboard } from '@app/hooks';
import { useTranslation } from 'react-i18next';
import { CopyAddressButton } from './Address.style';

export function CopyAddress({ useEmoji }: { useEmoji: boolean }) {
    const { t } = useTranslation('wallet');
    const { copyToClipboard, isCopied } = useCopyToClipboard();
    const walletAddress = useWalletStore((state) => state.tari_address_base58);
    const emojiAddress = useWalletStore((state) => state.tari_address_emoji);

    function handleCopyClick() {
        copyToClipboard(useEmoji ? emojiAddress : walletAddress);
    }

    return (
        <CopyAddressButton onClick={handleCopyClick}>
            {!isCopied ? t('receive.copy-address') : t('receive.copy-address-success')}
        </CopyAddressButton>
    );
}
