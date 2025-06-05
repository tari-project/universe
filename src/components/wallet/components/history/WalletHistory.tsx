import HistoryList from '@app/components/transactions/history/HistoryList.tsx';
import { Wrapper } from './styles.ts';

interface WalletHistoryProps {
    height?: number;
}
export default function WalletHistory({ height = 700 }: WalletHistoryProps) {
    return (
        <Wrapper style={{ height }}>
            <HistoryList />
        </Wrapper>
    );
}
