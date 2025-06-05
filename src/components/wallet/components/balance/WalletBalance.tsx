import i18n from 'i18next';
import NumberFlow, { type Format } from '@number-flow/react';
import { useWalletStore } from '@app/store';

import { roundToTwoDecimals, removeXTMCryptoDecimals } from '@app/utils';
import { Typography } from '@app/components/elements/Typography.tsx';
import { AvailableWrapper, BalanceWrapper, SuffixWrapper, Wrapper } from './styles.ts';
import { useTariBalance } from '@app/hooks/wallet/useTariBalance.ts';
import { useTranslation } from 'react-i18next';

export default function WalletBalance() {
    const { t } = useTranslation('wallet');
    const { formattedAvailableBalance } = useTariBalance();
    const calculated_balance = useWalletStore((s) => s.calculated_balance);
    const balanceValue = removeXTMCryptoDecimals(roundToTwoDecimals(calculated_balance || 0));

    const formatOptions: Format = {
        maximumFractionDigits: 2,
        notation: 'standard',
        style: 'decimal',
    };

    return (
        <Wrapper>
            <BalanceWrapper>
                <NumberFlow locales={i18n.language} format={formatOptions} value={balanceValue} />
                <SuffixWrapper>{` XTM`}</SuffixWrapper>
            </BalanceWrapper>
            <AvailableWrapper>
                <Typography>{`${t('history.available-balance')}: ${formattedAvailableBalance} XTM`}</Typography>
            </AvailableWrapper>
        </Wrapper>
    );
}
