import { TabItem } from './components/Tabs/types';
import { Tabs } from './components/Tabs/Tabs';
import { Send } from './send/Send';
import { Receive } from './receive/Receive';
import Wallet from './wallet/Wallet';
import { WalletTabWrapper } from './WalletSidebarContent.styles.ts';

const tabItems: TabItem[] = [
    {
        id: 'history',
        titleTransaltionKey: 'my_tari',
        content: <Wallet />,
    },
    {
        id: 'send',
        titleTransaltionKey: 'tabs.send',
        content: <Send />,
    },
    {
        id: 'receive',
        titleTransaltionKey: 'tabs.receive',
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
