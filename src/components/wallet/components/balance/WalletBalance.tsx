import i18n from 'i18next';
import { useTranslation } from 'react-i18next';
import NumberFlow from '@number-flow/react';

import { useUIStore, useWalletStore } from '@app/store';
import { BalanceWrapper } from './styles.ts';
import { roundToTwoDecimals } from '@app/utils';

export default function WalletBalance() {
    const { t } = useTranslation('common');
    const available_balance = useWalletStore((s) => s.balance?.available_balance);
    const calculated_balance = useWalletStore((s) => s.calculated_balance);
    const hideWalletBalance = useUIStore((s) => s.hideWalletBalance);

    const balanceValue = removeXTMCryptoDecimals(roundToTwoDecimals(calculated_balance));
    const formatOptions = {
        maximumFractionDigits: 2,
        notation: 'standard',
        style: 'decimal',
    };

    return (
        <BalanceWrapper>
            <NumberFlow locales={i18n.language} format={formatOptions} value={balanceValue} suffix={t('xtm')} />
        </BalanceWrapper>
    );
}
