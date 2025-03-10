import * as m from 'motion/react-m';
import styled from 'styled-components';
import { ReactNode } from 'react';
import { SB_WIDTH } from '@app/theme/styles.ts';
import { TabItem } from './types.ts';

const GUTTER = 10;
const SB_CONTENT_WIDTH = SB_WIDTH;

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
    width: ${SB_WIDTH}px;
`;

const SPRING_OPTIONS = { type: 'spring', stiffness: 300, damping: 30 };

interface TabItemProps {
    children: ReactNode;
}
function Item({ children }: TabItemProps) {
    return (
        <ItemWrapper
            style={{
                width: SB_WIDTH,
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
        <Track animate={{ x: -(currentIndex * (SB_CONTENT_WIDTH + GUTTER * 2)) }} transition={SPRING_OPTIONS}>
            {items.map(({ id, title, content }) => {
                return <Item key={`item-content-${id}-${title}`}>{content}</Item>;
            })}
        </Track>
    );
}

export { TabContent };
