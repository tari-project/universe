import { TabNav } from '@app/components/Tabs/TabNav.tsx';
import { TabContent } from '@app/components/Tabs/TabContent.tsx';
import styled from 'styled-components';
import { ReactNode, useState } from 'react';

const TabsWrapper = styled.div`
    width: 100%;
    align-items: center;
    display: flex;
    overflow-x: hidden;
`;
const Wrapper = styled.div`
    width: 100%;
    display: flex;
    align-items: center;
    flex-direction: column;
    position: relative;
`;

export interface TabItem {
    id: string;
    title: string;
    content: ReactNode;
}

interface TabsProps {
    tabItems: TabItem[];
}
export function Tabs({ tabItems }: TabsProps) {
    const [currentIndex, setCurrentIndex] = useState<number>(0);

    return (
        <Wrapper>
            <TabNav items={tabItems} currentIndex={currentIndex} onClick={setCurrentIndex} />
            <TabsWrapper>
                <TabContent items={tabItems} currentIndex={currentIndex} />
            </TabsWrapper>
        </Wrapper>
    );
}
