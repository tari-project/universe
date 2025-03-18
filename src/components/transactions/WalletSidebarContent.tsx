import { TabItem } from './components/Tabs/types';
import { Tabs } from './components/Tabs/Tabs';
import { Send } from './send/Send';
import { Receive } from './receive/Receive';
import Wallet from './wallet/Wallet';
import { WalletTabWrapper } from './WalletSidebarContent.styles.ts';

const tabItems: TabItem[] = [
    {
        id: 'history',
        titleTransaltionKey: 'wallet:tabs.history',
        content: <Wallet />,
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
