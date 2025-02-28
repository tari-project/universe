import * as m from 'motion/react-m';
import styled from 'styled-components';
import { ReactNode, useRef } from 'react';
import { TabItem } from '@app/components/Tabs/Tabs.tsx';

const Track = styled(m.div)`
    width: 100%;
    height: 100%;
    display: flex;
`;

const ItemWrapper = styled(m.div)`
    position: relative;
    display: flex;
    flex-shrink: 0;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
`;

const SPRING_OPTIONS = { type: 'spring', stiffness: 300, damping: 30 };

interface TabItemProps {
    children: ReactNode;
}
function Item({ children }: TabItemProps) {
    return (
        <ItemWrapper
            style={{
                width: '100%',
                height: '100%',
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
    const containerRef = useRef<HTMLDivElement>(null);
    const trackItemOffset = containerRef.current?.offsetWidth || 300;

    return (
        <Track ref={containerRef} animate={{ x: -(currentIndex * trackItemOffset) }} transition={SPRING_OPTIONS}>
            {items.map(({ id, title, content }) => {
                return <Item key={`item-content-${id}-${title}`}>{content}</Item>;
            })}
        </Track>
    );
}

export { TabContent };
