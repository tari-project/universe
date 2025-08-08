import { useEffect, useState } from 'react';
import { ListItemsWrapper, LoadingText, Rectangle, Wrapper } from './styles';
import { Trans } from 'react-i18next';

interface Props {
    loadingText?: string;
}

export default function ListLoadingAnimation({ loadingText }: Props) {
    const [activeSquares, setActiveSquares] = useState<number[]>([]);
    const totalSquares = 6;
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
            <LoadingText>
                <Trans>{loadingText}</Trans>
            </LoadingText>
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
