import { Tabs } from '@app/components/Tabs/Tabs.tsx';
import { TabItem } from '@app/components/Tabs/types.ts';

import { Send } from './tx-types/Send.tsx';
import { Receive } from './tx-types/Receive.tsx';
import HistoryList from './history/HistoryList.tsx';
import {
    ContentWrapper,
    HistoryListWrapper,
    TabContentWrapper,
    WalletBalanceWrapper,
} from './WalletSidebarContent.styles.ts';
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
            <TabContentWrapper>
                <HistoryListWrapper>
                    <HistoryList />
                </HistoryListWrapper>
            </TabContentWrapper>
        ),
        title: 'History',
    },
];

export function WalletSidebarContent() {
    return (
        <ContentWrapper>
            <Tabs tabItems={tabItems} />
            <WalletBalanceWrapper>
                <WalletBalanceMarkup />
            </WalletBalanceWrapper>
        </ContentWrapper>
    );
}
