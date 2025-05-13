import {
    GraphicContainer,
    HeroImg,
    HeroImgWrapper,
    HeroRings,
    HeroRingsWrapper,
    RingContainer,
} from './hero.styles.ts';
import { RingsSVG } from '@app/containers/floating/EXModal/RingsSVG.tsx';

interface HeroProps {
    primaryCol: string;
    secondaryCol: string;
    heroImgUrl: string;
}
export default function Hero({ heroImgUrl, primaryCol, secondaryCol }: HeroProps) {
    return (
        <GraphicContainer $brandPrimary={primaryCol} $brandSecondary={secondaryCol}>
            <HeroRings src="/assets/img/ring-coins.png" alt="Hero rings" />
            <RingContainer>
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
