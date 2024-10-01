import { useState } from 'react';
import { WalletContainer, Handle } from '../styles';
import formatBalance from '@app/utils/formatBalance.ts';
import CharSpinner from '@app/components/CharSpinner/CharSpinner.tsx';
import { BalanceVisibilityButton, WalletBalance, WalletBalanceContainer } from './Wallet.styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';
import { IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5';
import { Stack } from '@app/components/elements/Stack.tsx';
import { useWalletStore } from '@app/store/useWalletStore.ts';

function Wallet() {
    const { t } = useTranslation('sidebar', { useSuspense: false });
    const balance = useWalletStore((state) => state.balance);
    const formatted = formatBalance(balance || 0);
    const sizing = formatted.length <= 6 ? 50 : formatted.length <= 8 ? 44 : 32;
    const [showBalance, setShowBalance] = useState(true);

    const toggleBalanceVisibility = () => setShowBalance((prev) => !prev);
    const displayValue = balance === null ? '-' : showBalance ? formatted : '*****';
    return (
        <WalletContainer>
            <Handle />
            <WalletBalanceContainer>
                <Stack direction="row" alignItems="center">
                    <Typography variant="span" style={{ fontSize: '15px' }}>
                        {t('wallet-balance')}
                    </Typography>
                    <BalanceVisibilityButton onClick={toggleBalanceVisibility}>
                        {showBalance ? (
                            <IoEyeOffOutline size={14} color="white" />
                        ) : (
                            <IoEyeOutline size={14} color="white" />
                        )}
                    </BalanceVisibilityButton>
                </Stack>
                <WalletBalance>
                    <CharSpinner value={displayValue} variant="simple" fontSize={sizing} />
                </WalletBalance>
            </WalletBalanceContainer>
        </WalletContainer>
    );
}

export default Wallet;
