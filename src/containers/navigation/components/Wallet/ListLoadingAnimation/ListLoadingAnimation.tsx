import { useEffect, useState } from 'react';
import { ListItemsWrapper, LoadingText, Rectangle, Wrapper } from './styles';

interface Props {
    loadingText?: string;
}

export default function ListLoadingAnimation({ loadingText }: Props) {
    const [activeSquares, setActiveSquares] = useState<number[]>([]);
    const totalSquares = 5;
    const staggerDelay = 0.15;

    useEffect(() => {
        let animationTimeout: NodeJS.Timeout;
        let currentIndex = 0;

        const animateIn = () => {
            if (currentIndex < totalSquares) {
                const newActiveSquares = Array.from({ length: currentIndex + 1 }).map((_, i) => i);
                setActiveSquares(newActiveSquares);

                currentIndex++;
                animationTimeout = setTimeout(animateIn, staggerDelay * 1000);
            } else {
                animationTimeout = setTimeout(() => {
                    setActiveSquares([]);
                    currentIndex = 0;
                    animationTimeout = setTimeout(animateIn, 500);
                }, 1000);
            }
        };

        animateIn();

        return () => clearTimeout(animationTimeout);
    }, []);

    return (
        <Wrapper>
            <LoadingText>{loadingText}</LoadingText>
            <ListItemsWrapper>
                {Array.from({ length: totalSquares }).map((_, index) => (
                    <Rectangle
                        key={index}
                        initial={{ opacity: 0.5 }}
                        animate={activeSquares.includes(index) ? { opacity: 1 } : { opacity: 0.5 }}
                        transition={{
                            duration: 0.5,
                            ease: [0.15, 0, 0, 0.97],
                        }}
                    />
                ))}
            </ListItemsWrapper>
        </Wrapper>
    );
}
