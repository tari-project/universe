import { XCButton } from './styles.ts';
import { setShowUniversalModal, useExchangeStore } from '@app/store/useExchangeStore.ts';
import { useTranslation } from 'react-i18next';
import { Logos } from '@app/components/transactions/wallet/Exchanges/logos/Logos.tsx';

export default function ExchangeButton() {
    const { t } = useTranslation('wallet');
    const exchanges = useExchangeStore((s) => s.exchangeMiners);

    function handleClick() {
        setShowUniversalModal(true);
    }

    return exchanges?.length ? (
        <XCButton onClick={handleClick}>
            {t('xc.mine-directly-to')} <Logos exchanges={exchanges} variant="mini" />
        </XCButton>
    ) : null;
}
