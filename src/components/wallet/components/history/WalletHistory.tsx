import { Wrapper } from './styles.ts';
import HistoryList from '@app/components/transactions/history/HistoryList.tsx';

export default function WalletHistory() {
    return (
        <Wrapper>
            <HistoryList />
        </Wrapper>
    );
}
