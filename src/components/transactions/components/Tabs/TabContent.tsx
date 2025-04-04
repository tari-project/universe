import { PropsWithChildren } from 'react';
import { TabItem } from './types.ts';
import { ItemWrapper, Track, SB_CONTENT_WIDTH, GUTTER } from './tab.styles';
import { SB_WIDTH } from '@app/theme/styles.ts';
import React from 'react';

const SPRING_OPTIONS = { type: 'spring', stiffness: 300, damping: 30 };

export interface TabItemProps {
    setCurrentIndex: (index: number) => void;
}
function Item({ children, ...props }: PropsWithChildren<TabItemProps>) {
    return (
        <ItemWrapper
            style={{
                width: SB_CONTENT_WIDTH,
            }}
            transition={SPRING_OPTIONS}
        >
            {!!children && React.cloneElement(children as React.ReactElement, { ...props })}
        </ItemWrapper>
    );
}

interface TabContentProps {
    items: TabItem[];
    currentIndex: number;
    setCurrentIndex?: (index: number) => void;
}

function TabContent({
    items,
    currentIndex,
    setCurrentIndex = () => {
        /* void */
    },
}: TabContentProps) {
    return (
        <Track animate={{ x: -(currentIndex * (SB_WIDTH - GUTTER)) }} transition={SPRING_OPTIONS}>
            {items.map(({ id, content }, index) => {
                const isActiveTab = index === currentIndex;
                return (
                    <Item key={`item-content-${id}}`} setCurrentIndex={setCurrentIndex}>
                        {isActiveTab ? content : null}
                    </Item>
                );
            })}
        </Track>
    );
}

export { TabContent };
