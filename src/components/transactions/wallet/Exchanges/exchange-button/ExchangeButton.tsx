import { XCButton } from './styles.ts';
import { setShowUniversalModal } from '@app/store/useExchangeStore.ts';
import { useTranslation } from 'react-i18next';
import { Logos } from '@app/components/transactions/wallet/Exchanges/logos/Logos.tsx';
import { useFetchExchangeList } from '@app/hooks/exchanges/fetchExchanges.ts';

export default function ExchangeButton() {
    const { t } = useTranslation('wallet');
    const { data: exchanges } = useFetchExchangeList();

    function handleClick() {
        setShowUniversalModal(true);
    }

    return exchanges?.length ? (
        <XCButton onClick={handleClick}>
            {t('xc.mine-directly-to')} <Logos exchanges={exchanges} variant="mini" />
        </XCButton>
    ) : null;
}
