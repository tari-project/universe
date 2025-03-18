import { TabItem } from './components/Tabs/types';
import { Tabs } from './components/Tabs/Tabs';
import { Send } from './send/Send';
import { Receive } from './receive/Receive';
import HistoryList from './history/HistoryList';
import { HistoryWrapper, WalletTabWrapper } from './WalletSidebarContent.styles.ts';

const tabItems: TabItem[] = [
    {
        id: 'history',
        titleTransaltionKey: 'wallet:tabs.history',
        content: (
            <HistoryWrapper>
                <HistoryList />
            </HistoryWrapper>
        ),
    },
    {
        id: 'send',
        titleTransaltionKey: 'wallet:tabs.send',
        content: <Send />,
    },
    {
        id: 'receive',
        titleTransaltionKey: 'wallet:tabs.receive',
        content: <Receive />,
    },
];

export function WalletSidebarContent() {
    return (
        <WalletTabWrapper>
            <Tabs tabItems={tabItems} />
        </WalletTabWrapper>
    );
}
