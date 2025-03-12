import * as m from 'motion/react-m';
import styled from 'styled-components';
import { ReactNode } from 'react';
import { SB_SPACING, SB_WIDTH } from '@app/theme/styles.ts';
import { TabItem } from './types.ts';

const SB_CONTENT_WIDTH = SB_WIDTH - SB_SPACING * 2;

const Track = styled(m.div)`
    display: flex;
    flex-direction: row;
    gap: 20px;
    flex-shrink: 0;
`;

const ItemWrapper = styled(m.div)`
    position: relative;
    display: flex;
    flex-direction: column;
    max-height: 100%;
    width: ${SB_CONTENT_WIDTH}px;
`;

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
        <Track animate={{ x: -(currentIndex * (SB_CONTENT_WIDTH + SB_SPACING)) }} transition={SPRING_OPTIONS}>
            {items.map(({ id, content }) => {
                return <Item key={`item-content-${id}}`}>{content}</Item>;
            })}
        </Track>
    );
}

export { TabContent };
