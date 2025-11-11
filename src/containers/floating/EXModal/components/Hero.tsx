import {
    GraphicContainer,
    HeroCoinImg,
    HeroCoinWrapper,
    HeroImg,
    HeroImgWrapper,
    HeroRingsWrapper,
    RingContainer,
} from './hero.styles.ts';
import { RingsSVG } from '@app/containers/floating/EXModal/RingsSVG.tsx';

interface HeroProps {
    primaryCol?: string;
    secondaryCol?: string;
    heroImgUrl?: string;
}

const initial = { opacity: 0, scale: 0 };
const animate = { opacity: 1, scale: 1 };
const transition = { rotate: { delay: 0.1, duration: 0.6 } };
const style = { x: '0%', y: '0%' };

export default function Hero({ heroImgUrl, primaryCol, secondaryCol }: HeroProps) {
    return (
        <GraphicContainer $brandPrimary={primaryCol} $brandSecondary={secondaryCol}>
            <HeroCoinWrapper
                initial={{ ...initial, rotate: 10 }}
                animate={{ ...animate, rotate: 0 }}
                style={style}
                transition={transition}
            >
                <HeroCoinImg src="/assets/img/ring-coins.png" alt="Hero rings" />
            </HeroCoinWrapper>
            <RingContainer initial={initial} animate={animate} style={style}>
                <HeroRingsWrapper>
                    <RingsSVG />
                </HeroRingsWrapper>
            </RingContainer>
            <HeroImgWrapper>
                <HeroImg src={heroImgUrl} alt="Modl Hero Image" />
            </HeroImgWrapper>
        </GraphicContainer>
    );
}
