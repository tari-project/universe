import { WalletContainer, Handle } from '../styles';
import { useWalletStore } from '@app/store/walletStore';
import formatBalance from '@app/utils/formatBalance.ts';
import CharSpinner from '@app/components/CharSpinner/CharSpinner.tsx';
import { WalletBalance, WalletBalanceContainer } from './Wallet.styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';

function Wallet() {
    const { t } = useTranslation('sidebar', { useSuspense: false });
    const balance = useWalletStore((state) => state.balance);
    const formatted = formatBalance(balance);
    const sizing = formatted.length <= 6 ? 60 : formatted.length <= 8 ? 44 : 32;

    return (
        <WalletContainer>
            <Handle />
            <WalletBalanceContainer>
                <Typography variant="p">{t('wallet-balance')}</Typography>
                <WalletBalance>
                    <CharSpinner value={formatted} variant="simple" fontSize={sizing} />
                </WalletBalance>
            </WalletBalanceContainer>
        </WalletContainer>
    );
}

export default Wallet;
