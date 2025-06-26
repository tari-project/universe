import styled from 'styled-components';
import { m } from 'motion/react';

interface BrandColours {
    $brandPrimary?: string;
    $brandSecondary?: string;
}

export const GraphicContainer = styled.div<BrandColours>`
    min-width: 310px;
    width: 45%;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    background-image: ${({ $brandPrimary, $brandSecondary }) =>
        `linear-gradient(159deg, ${$brandPrimary} 3.14%, ${$brandSecondary} 146.13%)`};
    border-radius: 34px;
    user-select: none;
    pointer-events: none;
`;

export const HeroImgWrapper = styled.div`
    border-radius: 100%;
    width: 150px;
    height: 150px;
    background: ${({ theme }) => theme.colors.greyscale['50']};
    box-shadow: 0 4px 34px rgba(0, 0, 0, 0.25);
    padding: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
`;
export const HeroImg = styled.img`
    width: 100%;
`;

export const RingContainer = styled(m.div)<BrandColours>`
    overflow: hidden;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
`;
export const HeroRingsWrapper = styled.div`
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    svg {
        position: relative;
    }
`;
export const HeroCoinWrapper = styled(m.div)`
    position: absolute;
    z-index: 11;
`;

export const HeroCoinImg = styled(m.img)`
    //position: absolute;
    z-index: 10;
`;
