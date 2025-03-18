import { useState } from 'react';

import { type TabsProps } from './types';
import { TabNav } from './TabNav.tsx';
import { TabContent } from './TabContent.tsx';
import { TabsWrapper, TabContentWrapper, Wrapper } from './tab.styles';

export function Tabs({ tabItems }: TabsProps) {
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    return (
        <TabContentWrapper>
            <Wrapper>
                <TabsWrapper>
                    <TabContent items={tabItems} currentIndex={currentIndex} />
                </TabsWrapper>
                <TabNav items={tabItems} currentIndex={currentIndex} onClick={setCurrentIndex} />
            </Wrapper>
        </TabContentWrapper>
    );
}
