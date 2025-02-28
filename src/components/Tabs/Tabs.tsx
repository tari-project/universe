import { TabNav } from '@app/components/Tabs/TabNav.tsx';
import { TabContent } from '@app/components/Tabs/TabContent.tsx';
import styled from 'styled-components';
import { useState } from 'react';

const TabsWrapper = styled.div`
    width: 200px;
    height: 200px;
    background: rgba(255, 192, 203, 0.31);
    align-items: center;
    display: flex;
    overflow: hidden;
`;
const Wrapper = styled.div`
    width: 100%;
    display: flex;
    align-items: center;
    flex-direction: column;
    position: relative;
    border-radius: 24px;
`;

export function Tabs({ items }: { items: string[] }) {
    const [currentIndex, setCurrentIndex] = useState<number>(0);

    return (
        <Wrapper>
            <TabNav items={items} currentIndex={currentIndex} onClick={setCurrentIndex} />
            <TabsWrapper>
                <TabContent items={items} currentIndex={currentIndex} />
            </TabsWrapper>
        </Wrapper>
    );
}
