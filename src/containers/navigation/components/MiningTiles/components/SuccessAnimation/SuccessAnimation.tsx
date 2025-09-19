import NumberFlow from '@number-flow/react';
import { Coin, CoinImage, Coins, Eyebrow, MiddleText, Number, NumberGroup, Unit, Wrapper } from './styles';
import i18next from 'i18next';
import coinImage1 from './images/coin1.png';
import coinImage2 from './images/coin2.png';
import coinImage3 from './images/coin3.png';
import coinImage4 from './images/coin4.png';
import { useEffect, useState } from 'react';
import { AnimatePresence, Variants } from 'motion/react';
import { useTranslation } from 'react-i18next';

const coins = [
    { img: coinImage1, delay: 0.3, $top: '-20px', $left: '40px', $width: '49px' },
    { img: coinImage2, delay: 0.1, $top: '0', $right: '-20px', $width: '58px' },
    { img: coinImage3, delay: 0.2, $bottom: '-65px', $right: '5px', $width: '88px' },
    { img: coinImage4, delay: 0.0, $top: '-20px', $left: '-30px', $width: '87px' },
];

const wrapperMotion = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
};

const eyebrowMotion = {
    initial: { opacity: 0, scale: 0.5 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.75 },
};

const numberGroupMotion = {
    initial: { opacity: 0, scale: 0.5 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.75 },
};

const coinAnimation = (delay: number): Variants => ({
    initial: {
        opacity: 0,
        scale: 1.5,
    },
    animate: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.35,
            delay,
            ease: [0.4, 0, 0.2, 1],
        },
    },
    exit: {
        opacity: 0,
        scale: 0.75,
    },
});

interface Props {
    show: boolean;
    setShow: (show: boolean) => void;
    value: number;
    unit: string;
}

export default function SuccessAnimation({ show, setShow, value, unit = 'XTM' }: Props) {
    const { t } = useTranslation('sidebar');
    const [animatedValue, setAnimatedValue] = useState(0);

    useEffect(() => {
        if (show) {
            setAnimatedValue(0);
            setTimeout(() => setAnimatedValue(value), 10);
        }

        return () => {
            setAnimatedValue(0);
        };
    }, [show, value]);

    useEffect(() => {
        if (!show) return;
        const timer = setTimeout(() => setShow(false), 5000);
        return () => clearTimeout(timer);
    }, [show, setShow]);

    return (
        <AnimatePresence>
            {show && (
                <Wrapper {...wrapperMotion}>
                    <MiddleText>
                        <Eyebrow {...eyebrowMotion}>{t('reward.stacked')}</Eyebrow>
                        <NumberGroup {...numberGroupMotion}>
                            <Number>
                                <NumberFlow
                                    locales={i18next.language}
                                    format={{
                                        minimumFractionDigits: 1,
                                        maximumFractionDigits: 4,
                                        notation: 'standard',
                                        style: 'decimal',
                                    }}
                                    value={animatedValue}
                                />
                            </Number>
                            <Unit>{unit}</Unit>
                        </NumberGroup>
                    </MiddleText>

                    <Coins>
                        {coins.map(({ img, delay, ...pos }, i) => (
                            <Coin key={i} {...pos} {...coinAnimation(delay)}>
                                <CoinImage src={img} $animationDelay={`${i * 0.5}s`} />
                            </Coin>
                        ))}
                    </Coins>
                </Wrapper>
            )}
        </AnimatePresence>
    );
}
