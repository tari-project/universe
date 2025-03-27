import { ReactNode } from 'react';
import { TabItem } from './types.ts';
import { ItemWrapper, Track, SB_CONTENT_WIDTH, GUTTER } from './tab.styles';
import { SB_WIDTH } from '@app/theme/styles.ts';

const SPRING_OPTIONS = { type: 'spring', stiffness: 300, damping: 30 };

interface TabItemProps {
    children: ReactNode;
}
function Item({ children }: TabItemProps) {
    return (
        <ItemWrapper
            style={{
                width: SB_CONTENT_WIDTH,
            }}
            transition={SPRING_OPTIONS}
        >
            {children}
        </ItemWrapper>
    );
}

interface TabContentProps {
    items: TabItem[];
    currentIndex: number;
}

function TabContent({ items, currentIndex }: TabContentProps) {
    return (
        <Track animate={{ x: -(currentIndex * (SB_WIDTH - GUTTER)) }} transition={SPRING_OPTIONS}>
            {items.map(({ id, content }, index) => {
                const isActiveTab = index === currentIndex;
                return <Item key={`item-content-${id}}`}>{isActiveTab ? content : null}</Item>;
            })}
        </Track>
    );
}

export { TabContent };
