import { BlockData } from '../useBlocks';
import { DragContainer, ScrollMask } from './styles';
import { useRef, useState, useEffect, Suspense } from 'react';
import { useMotionValue, useAnimation, useSpring } from 'motion/react';
import BlockEntry from '../BlockEntry/BlockEntry';

interface Props {
    data?: BlockData[];
    containerRef: React.RefObject<HTMLDivElement | null>;
}

export default function BlockScrollList({ data, containerRef }: Props) {
    const dragContainerRef = useRef<HTMLDivElement>(null);
    const [dragConstraints, setDragConstraints] = useState({ left: 0, right: 0 });

    const x = useMotionValue(0);
    const springConfig = { stiffness: 400, damping: 100, mass: 1 };
    const springX = useSpring(x, springConfig);
    const controls = useAnimation();

    useEffect(() => {
        if (containerRef && containerRef.current && dragContainerRef.current) {
            const calculateConstraints = () => {
                const containerWidth = containerRef.current?.clientWidth || 0;
                const contentWidth = dragContainerRef.current?.scrollWidth || 0;

                if (contentWidth > containerWidth) {
                    setDragConstraints({
                        left: -(contentWidth - containerWidth),
                        right: 0,
                    });
                }
            };

            calculateConstraints();

            const resizeObserver = new ResizeObserver(calculateConstraints);
            resizeObserver.observe(containerRef.current);
            resizeObserver.observe(dragContainerRef.current);

            return () => {
                resizeObserver.disconnect();
            };
        }
    }, [containerRef]);

    return (
        <ScrollMask>
            <DragContainer
                ref={dragContainerRef}
                drag={'x'}
                dragConstraints={dragConstraints}
                dragElastic={0.1}
                style={{ x: springX }}
                dragTransition={{
                    power: 0.8,
                    timeConstant: 700,
                    modifyTarget: (target) => Math.round(target / 50) * 50,
                }}
                animate={controls}
            >
                <Suspense fallback={<div></div>}>
                    {data &&
                        data.map(({ id, minersSolved, reward, timeAgo, isSolving, blocks }) => (
                            <BlockEntry
                                key={id}
                                id={id}
                                minersSolved={minersSolved}
                                reward={reward}
                                timeAgo={timeAgo}
                                isSolving={isSolving}
                                blocks={blocks}
                            />
                        ))}
                </Suspense>
            </DragContainer>
        </ScrollMask>
    );
}
