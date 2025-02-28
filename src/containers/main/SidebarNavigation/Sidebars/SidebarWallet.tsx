import { memo } from 'react';
import { SB_WIDTH } from '@app/theme/styles.ts';
import { SidebarWrapper } from '../SidebarNavigation.styles.ts';
import { SidebarGrid } from './SidebarWallet.styles.ts';
import { TabItem, Tabs } from '@app/components/Tabs/Tabs.tsx';

const variants = {
    open: { opacity: 1, right: 0, transition: { duration: 0.3, ease: 'easeIn' } },
    closed: { opacity: 0.5, right: -50, transition: { duration: 0.05, ease: 'easeOut' } },
};

const tabItems: TabItem[] = [
    {
        id: 'send',
        title: 'Send',
        content: <p>{`meow`}</p>,
    },
    {
        id: 'receive',
        title: 'Receiew',
        content: <div>{`mmmeeeeemememeow`}</div>,
    },
];
const SidebarWallet = memo(function SidebarWallet() {
    return (
        <SidebarWrapper
            style={{ width: SB_WIDTH, gridArea: 'wallet' }}
            variants={variants}
            initial="closed"
            exit="closed"
            animate="open"
        >
            <SidebarGrid>
                <Tabs tabItems={tabItems} />
            </SidebarGrid>
        </SidebarWrapper>
    );
});

export default SidebarWallet;
