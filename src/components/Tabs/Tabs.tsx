import { useState } from 'react';
import styled from 'styled-components';
import { TabNav } from '@app/components/Tabs/TabNav.tsx';
import { TabContent } from '@app/components/Tabs/TabContent.tsx';
import { type TabsProps } from './types';
import { TabContentWrapper } from '@app/components/transactions/WalletSidebarContent.styles.ts';

const TabsWrapper = styled.div`
    width: 100%;
    align-items: center;
    display: flex;
`;
const Wrapper = styled.div`
    width: 100%;
    display: flex;
    align-items: center;
    flex-direction: column;
    position: relative;
`;

export function Tabs({ tabItems }: TabsProps) {
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    return (
        <TabContentWrapper>
            <Wrapper>
                <TabNav items={tabItems} currentIndex={currentIndex} onClick={setCurrentIndex} />
                <TabsWrapper>
                    <TabContent items={tabItems} currentIndex={currentIndex} />
                </TabsWrapper>
            </Wrapper>
        </TabContentWrapper>
    );
}
