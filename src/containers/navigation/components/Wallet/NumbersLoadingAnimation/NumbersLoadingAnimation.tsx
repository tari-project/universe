import { useEffect, useState } from 'react';
import { Circle, Square, SquareWrapper, Wrapper } from './styles';

export default function NumbersLoadingAnimation() {
    const [activeSquares, setActiveSquares] = useState<number[]>([]);
    const totalSquares = 7;
    const staggerDelay = 0.15;

    useEffect(() => {
        let animationTimeout: NodeJS.Timeout;
        let currentIndex = 0;
        let isMounted = true;

        const animateIn = () => {
            if (!isMounted) return;

            if (currentIndex < totalSquares) {
                const newActiveSquares = Array.from({ length: currentIndex + 1 }).map((_, i) => i);
                setActiveSquares(newActiveSquares);

                currentIndex++;
                animationTimeout = setTimeout(animateIn, staggerDelay * 1000);
            } else {
                animationTimeout = setTimeout(() => {
                    if (!isMounted) return;
                    setActiveSquares([]);
                    currentIndex = 0;
                    animationTimeout = setTimeout(animateIn, 500);
                }, 1000);
            }
        };

        animateIn();

        return () => {
            isMounted = false;
            if (animationTimeout) {
                clearTimeout(animationTimeout);
            }
        };
    }, []);

    return (
        <Wrapper>
            <SquareWrapper>
                {Array.from({ length: totalSquares }).map((_, index) => (
                    <Square
                        key={index}
                        initial={{ scale: 0.75, opacity: 0.5 }}
                        animate={
                            activeSquares.includes(index) ? { scale: 1, opacity: 0.8 } : { scale: 0.75, opacity: 0.5 }
                        }
                        transition={{
                            duration: 0.5,
                            ease: [0.15, 0, 0, 0.97],
                        }}
                    />
                ))}
            </SquareWrapper>

            <Circle />
        </Wrapper>
    );
}
