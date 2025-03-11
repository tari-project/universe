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
        content: (
            <HistoryWrapper>
                <HistoryList />
            </HistoryWrapper>
        ),
        title: 'History',
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
