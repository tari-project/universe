import NumberFlow from '@number-flow/react';
import { Coin, CoinImage, Coins, Eyebrow, MiddleText, Number, NumberGroup, Unit, Wrapper } from './styles';
import i18next from 'i18next';
import coinImage1 from './images/coin1.png';
import coinImage2 from './images/coin2.png';
import coinImage3 from './images/coin3.png';
import coinImage4 from './images/coin4.png';

const coins = [
    { img: coinImage1, delay: 0.0, $top: '-20px', $left: '40px', $width: '49px' },
    { img: coinImage2, delay: 0.1, $top: '0', $right: '-20px', $width: '58px' },
    { img: coinImage3, delay: 0.14, $bottom: '-60px', $right: '5px', $width: '88px' },
    { img: coinImage4, delay: 0.21, $top: '-20px', $left: '-30px', $width: '87px' },
];

const coinAnimation = (delay: number) => ({
    initial: {
        opacity: 0,
        scale: 0.75,
        y: -10,
    },
    animate: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            duration: 0.5,
            delay,
            ease: [0.4, 0, 0.2, 1],
        },
    },
    exit: {
        opacity: 0,
        y: 0,
        scale: 0.75,
        transition: {
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1],
        },
    },
});

export default function SuccessAnimation() {
    return (
        <Wrapper>
            <MiddleText>
                <Eyebrow
                    initial={{
                        opacity: 0,
                        scale: 0.75,
                    }}
                    animate={{
                        opacity: 1,
                        scale: 1,
                    }}
                    transition={{
                        duration: 0.5,
                        ease: [0.4, 0, 0.2, 1],
                    }}
                >{`You stacked`}</Eyebrow>
                <NumberGroup
                    initial={{
                        opacity: 0,
                        scale: 0.75,
                    }}
                    animate={{
                        opacity: 1,
                        scale: 1,
                    }}
                    transition={{
                        duration: 0.5,
                        ease: [0.4, 0, 0.2, 1],
                    }}
                >
                    <Number>
                        <NumberFlow
                            locales={i18next.language}
                            format={{
                                minimumFractionDigits: 1,
                                maximumFractionDigits: 4,
                                notation: 'standard',
                                style: 'decimal',
                            }}
                            value={1.25}
                        />
                    </Number>
                    <Unit>XTM</Unit>
                </NumberGroup>
            </MiddleText>

            <Coins>
                {coins.map(({ img, delay, ...pos }, i) => (
                    <Coin key={i} {...pos} {...coinAnimation(delay)}>
                        <CoinImage src={img} $animationDelay={`${delay}s`} />
                    </Coin>
                ))}
            </Coins>
        </Wrapper>
    );
}
