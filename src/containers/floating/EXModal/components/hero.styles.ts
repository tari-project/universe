import styled from 'styled-components';

interface BrandColours {
    $brandPrimary?: string;
    $brandSecondary?: string;
}

export const RingContainer = styled.div<BrandColours>`
    overflow: hidden;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    position: absolute;
`;
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
    background: ${({ theme }) => theme.colors.greyscale['100']};
    padding: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
`;
export const HeroImg = styled.img`
    width: 100%;
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
export const HeroRings = styled.img`
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: 10;
`;
