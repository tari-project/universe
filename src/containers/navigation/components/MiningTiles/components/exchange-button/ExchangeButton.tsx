import { setShowUniversalModal } from '@app/store/useExchangeStore.ts';
import { useTranslation } from 'react-i18next';
import { Logos } from '@app/components/transactions/wallet/Exchanges/logos/Logos.tsx';
import { useFetchExchangeList } from '@app/hooks/exchanges/fetchExchanges.ts';
import { Button, LogosWrapper } from './styles.ts';

export default function ExchangeButton() {
    const { t } = useTranslation('wallet');
    const { data: exchanges } = useFetchExchangeList();
    function handleClick() {
        setShowUniversalModal(true);
    }

    if (!exchanges?.length) return null;

    return (
        <Button onClick={handleClick}>
            {t('xc.mine-directly-to')}{' '}
            <LogosWrapper>
                <Logos exchanges={exchanges} variant="mini" />
            </LogosWrapper>
        </Button>
    );
}
