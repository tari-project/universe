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
    const springConfig = { stiffness: 300, damping: 80, mass: 0.5 };
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

    // Handle manual touch/pointer dragging for better Tauri support
    const handleTouchStart = (e: React.PointerEvent) => {
        const element = dragContainerRef.current;
        if (!element) return;

        const startX = e.clientX;
        const startScrollLeft = x.get();

        const handleTouchMove = (e: PointerEvent) => {
            const dx = e.clientX - startX;
            let newX = startScrollLeft + dx;

            // Apply constraints
            if (newX > dragConstraints.right) newX = dragConstraints.right;
            if (newX < dragConstraints.left) newX = dragConstraints.left;

            x.set(newX);
        };

        const handleTouchEnd = () => {
            window.removeEventListener('pointermove', handleTouchMove);
            window.removeEventListener('pointerup', handleTouchEnd);
            window.removeEventListener('pointercancel', handleTouchEnd);
        };

        window.addEventListener('pointermove', handleTouchMove);
        window.addEventListener('pointerup', handleTouchEnd);
        window.addEventListener('pointercancel', handleTouchEnd);
    };

    return (
        <ScrollMask>
            <DragContainer
                ref={dragContainerRef}
                drag={'x'}
                dragConstraints={dragConstraints}
                dragElastic={0.05}
                style={{ x: springX }}
                dragTransition={{
                    power: 0.6,
                    timeConstant: 400,
                    modifyTarget: (target) => Math.round(target / 50) * 50,
                }}
                animate={controls}
                onPointerDown={handleTouchStart}
            >
                <Suspense fallback={<div></div>}>
                    {data &&
                        data.map(({ id, minersSolved, reward, timeAgo, blocks }) => (
                            <BlockEntry
                                key={id}
                                id={id}
                                minersSolved={minersSolved}
                                reward={reward}
                                timeAgo={timeAgo}
                                blocks={blocks}
                            />
                        ))}
                </Suspense>
            </DragContainer>
        </ScrollMask>
    );
}
