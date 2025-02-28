import * as m from 'motion/react-m';
import { useMotionValue } from 'motion/react';
import styled from 'styled-components';

const Track = styled(m.div)`
    width: 200px;
    display: flex;
`;

const ItemWrapper = styled(m.div)`
    position: relative;
    display: flex;
    flex-shrink: 0;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    background-color: #0d0d0d;
    cursor: grab;
`;

const SPRING_OPTIONS = { type: 'spring', stiffness: 300, damping: 30 };

interface TabItemProps {
    item: string;
}
function TabItem({ item }: TabItemProps) {
    return (
        <ItemWrapper
            style={{
                width: 200,
                height: '100%',
            }}
            transition={SPRING_OPTIONS}
        >
            <div className="carousel-item-content">
                <div className="carousel-item-title">{item}</div>
            </div>
        </ItemWrapper>
    );
}

function TabContent({ items, currentIndex }: { items: string[]; currentIndex: number }) {
    const trackItemOffset = 200;
    const x = useMotionValue(0);
    return (
        <Track
            style={{
                width: 200,
                perspective: 1000,
                perspectiveOrigin: `${currentIndex * trackItemOffset + 200 / 2}px 50%`,
                x: x.get(),
            }}
            animate={{ x: -(currentIndex * trackItemOffset) }}
            transition={SPRING_OPTIONS}
        >
            {items.map((item, index) => {
                return <TabItem key={index} item={item} />;
            })}
        </Track>
    );
}

export { TabContent };
