import { Wrapper } from './styles.ts';
import HistoryList from '@app/components/transactions/history/HistoryList.tsx';
import { useEffect, useRef } from 'react';

interface WalletHistoryProps {
    handleScroll: (scrolling: boolean) => void;
}
export default function WalletHistory({ handleScroll }: WalletHistoryProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const wrapper = ref.current;
        wrapper?.addEventListener('scroll', () => handleScroll(true));
        wrapper?.addEventListener('scrollend', () => handleScroll(false));

        return () => {
            wrapper?.removeEventListener('scroll', () => handleScroll(true));
            wrapper?.removeEventListener('scrollend', () => handleScroll(false));
        };
    }, [handleScroll]);

    return (
        <Wrapper ref={ref}>
            <HistoryList />
        </Wrapper>
    );
}
