import { TabItem, Tabs } from '@app/components/Tabs/Tabs.tsx';

import { Send } from '@app/components/transactions/Send.tsx';
import { Receive } from '@app/components/transactions/Receive.tsx';
import TXHistory from '@app/components/transactions/TxHistory.tsx';

const tabItems: TabItem[] = [
    {
        id: 'history',
        content: <TXHistory />,
        title: 'History',
    },
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
];

export function WalletSidebarContent() {
    return <Tabs tabItems={tabItems} />;
}
