import { TabItem, Tabs } from '@app/components/Tabs/Tabs.tsx';

import { Send } from './tx-types/Send.tsx';
import { Receive } from './tx-types/Receive.tsx';
import HistoryList from './history/HistoryList.tsx';

const tabItems: TabItem[] = [
    {
        id: 'send',
        title: 'Send',
        content: <Send />,
    },
    {
        id: 'receive',
        title: 'Receive',
        content: <Receive />,
    },
    {
        id: 'history',
        content: <HistoryList />,
        title: 'History',
    },
];

export function WalletSidebarContent() {
    return <Tabs tabItems={tabItems} />;
}
