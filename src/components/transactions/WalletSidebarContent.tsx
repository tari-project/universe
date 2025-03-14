import { Tabs } from '@app/components/Tabs/Tabs.tsx';
import { TabItem } from '@app/components/Tabs/types.ts';

import { Send } from './send/Send.tsx';
import { Receive } from './receive/Receive.tsx';
import HistoryList from './history/HistoryList.tsx';
import { ContentWrapper, HistoryWrapper, TabWrapper, WalletBalanceWrapper } from './WalletSidebarContent.styles.ts';
import WalletBalanceMarkup from '@app/containers/main/SidebarNavigation/components/Wallet/WalletBalanceMarkup.tsx';

const tabItems: TabItem[] = [
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
    {
        id: 'history',
        titleTransaltionKey: 'wallet:tabs.history',
        content: (
            <HistoryWrapper>
                <HistoryList />
            </HistoryWrapper>
        ),
    },
];

export function WalletSidebarContent() {
    return (
        <ContentWrapper>
            <TabWrapper>
                <Tabs tabItems={tabItems} />
            </TabWrapper>
            <WalletBalanceWrapper>
                <WalletBalanceMarkup />
            </WalletBalanceWrapper>
        </ContentWrapper>
    );
}
