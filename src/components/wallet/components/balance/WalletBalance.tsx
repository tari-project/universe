import i18n from 'i18next';
import NumberFlow, { type Format } from '@number-flow/react';
import { useWalletStore } from '@app/store';

import { roundToTwoDecimals, removeXTMCryptoDecimals } from '@app/utils';
import { Typography } from '@app/components/elements/Typography.tsx';
import { AvailableWrapper, BalanceWrapper, SuffixWrapper, Wrapper } from './styles.ts';
import { useTariBalance } from '@app/hooks/wallet/useTariBalance.ts';
import { useTranslation } from 'react-i18next';
import NumbersLoadingAnimation from '@app/containers/navigation/components/Wallet/NumbersLoadingAnimation/NumbersLoadingAnimation.tsx';

export default function WalletBalance() {
    const { t } = useTranslation('wallet');
    const { formattedAvailableBalance } = useTariBalance();
    const calculated_balance = useWalletStore((s) => s.calculated_balance);
    const balanceValue = removeXTMCryptoDecimals(roundToTwoDecimals(calculated_balance || 0));
    const isWalletScanning = useWalletStore((s) => s.wallet_scanning?.is_scanning);
    const formatOptions: Format = {
        maximumFractionDigits: 2,
        notation: 'standard',
        style: 'decimal',
    };

    return (
        <Wrapper>
            {!isWalletScanning ? (
                <>
                    <BalanceWrapper>
                        <NumberFlow locales={i18n.language} format={formatOptions} value={balanceValue} />
                        <SuffixWrapper>{` XTM`}</SuffixWrapper>
                    </BalanceWrapper>
                    <AvailableWrapper>
                        <Typography>{`${t('history.available-balance')}: ${formattedAvailableBalance} XTM`}</Typography>
                    </AvailableWrapper>
                </>
            ) : (
                <NumbersLoadingAnimation />
            )}
        </Wrapper>
    );
}
