import styled from 'styled-components';

interface BlockHeightBgProps {
    length: number;
}

const topHeight = 115;
const bottomHeight = 115;

export const Wrapper = styled.div`
    * {
        font-weight: 900;
    }
`;
export const RulerAbsoluteWrapper = styled.div`
    z-index: 100;
    position: absolute;
    right: 0;
    height: calc(100vh - ${topHeight}px - ${bottomHeight}px);
    flex-direction: column;
    top: 50%;
    transform: translateY(-50%);
`;

export const RulerContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    z-index: 2;
`;

export const RulerMarkContainer = styled.div`
    display: flex;
    flex-direction: row;
    min-width: 50px;
    align-items: center;
    justify-content: flex-end;
    height: 3px;
    overflow: visible;
    gap: 10px;
`;

export const RulerMark = styled('div')`
    width: 10px;
    height: 1px;
    background-color: ${({ theme }) => theme.palette.text.primary};
`;

export const BlockHeightLrg = styled.div`
    font-family: DrukWideLCGBold, sans-serif;
    font-weight: 900;
    font-size: 25px;
    letter-spacing: -0.8px;
    color: ${({ theme }) => theme.palette.text.primary};
    position: absolute;
    top: 50%;
    right: 15px;
    display: flex;
    z-index: 2;
    transform: translateY(-50%);
`;

export const BlockHeightSml = styled.div`
    font-family: Poppins, sans-serif;
    font-variant-numeric: tabular-nums;
    font-size: 11px;
    color: ${({ theme }) => theme.palette.text.primary};
    opacity: 0.2;
`;

export const BlockHeightBg = styled.div<BlockHeightBgProps>`
    font-family: DrukWideLCGBold, sans-serif;
    font-size: ${({ length }) => (length > 5 ? '100px' : '152px')};
    line-height: ${({ length }) => (length > 5 ? '100px' : '152px')};
    letter-spacing: -3px;
    color: rgba(255, 255, 255, 0.4);
    text-transform: uppercase;
    position: absolute;
    width: calc(100vh - ${topHeight}px - ${bottomHeight}px);
    top: 0;
    right: ${({ length }) => (length > 5 ? '100px' : '125px')};
    height: ${({ length }) => (length > 5 ? '100px' : '152px')};
    rotate: 270deg;
    z-index: 1;
    transform-origin: top right;
    display: flex;
    align-items: flex-end;
    justify-content: center;
`;
