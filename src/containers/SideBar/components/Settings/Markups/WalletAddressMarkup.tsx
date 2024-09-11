import { useCallback, useState } from 'react';
import { useAppStatusStore } from '@app/store/useAppStatusStore.ts';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { IconButton } from '@app/components/elements/Button.tsx';
import { IoCopyOutline, IoCheckmarkOutline } from 'react-icons/io5';
import { useTranslation } from 'react-i18next';

const WalletAddressMarkup = () => {
    const { t } = useTranslation('settings', { useSuspense: false });
    const { walletAddress, walletAddressEmoji } = useAppStatusStore((state) => ({
        walletAddress: state.tari_address_base58,
        walletAddressEmoji: state.tari_address_emoji,
    }));

    const [isCopyTooltipHiddenWalletAddress, setIsCopyTooltipHiddenWalletAddress] = useState(true);

    const copyWalletAddress = useCallback(async () => {
        setIsCopyTooltipHiddenWalletAddress(false);
        await navigator.clipboard.writeText(walletAddress + '');
        setTimeout(() => setIsCopyTooltipHiddenWalletAddress(true), 1000);
    }, [walletAddress]);

    if (!walletAddress) return null;

    return (
        <Stack>
            <Stack direction="row" justifyContent="space-between" style={{ height: 40 }}>
                <Typography variant="h6">{t('tari-wallet-address')}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
                <Typography variant="p">{walletAddress}</Typography>
                <IconButton onClick={copyWalletAddress}>
                    {isCopyTooltipHiddenWalletAddress ? <IoCopyOutline /> : <IoCheckmarkOutline />}
                </IconButton>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
                <Typography variant="p">{walletAddressEmoji}</Typography>
            </Stack>
        </Stack>
    );
};

export default WalletAddressMarkup;
