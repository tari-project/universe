import { MotionWrapper, XCButton } from './styles.ts';
import { setShowUniversalModal } from '@app/store/useExchangeStore.ts';
import { useTranslation } from 'react-i18next';
import { Logos } from '@app/components/transactions/wallet/Exchanges/logos/Logos.tsx';
import { useFetchExchangeList } from '@app/hooks/exchanges/fetchExchanges.ts';
import { AnimatePresence } from 'motion/react';

interface Props {
    isScrolled: boolean;
}

export default function ExchangeButton({ isScrolled }: Props) {
    const { t } = useTranslation('wallet');
    const { data: exchanges } = useFetchExchangeList();

    function handleClick() {
        setShowUniversalModal(true);
    }

    if (!exchanges?.length) return null;

    return (
        <AnimatePresence>
            {!isScrolled && (
                <MotionWrapper
                    initial={{ height: 'auto', opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                    <XCButton onClick={handleClick}>
                        {t('xc.mine-directly-to')} <Logos exchanges={exchanges} variant="mini" />
                    </XCButton>
                </MotionWrapper>
            )}
        </AnimatePresence>
    );
}
