import HistoryList from '../history/HistoryList.tsx';
import { HistoryWrapper } from './wallet.style';
import WalletBalanceMarkup from '@app/containers/navigation/components/Wallet/WalletBalanceMarkup.tsx';

export default function Wallet() {
    return (
        <>
            <WalletBalanceMarkup />
            <HistoryWrapper>
                <HistoryList />
            </HistoryWrapper>
        </>
    );
}
