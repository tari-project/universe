import * as m from 'motion/react-m';
import styled, { css } from 'styled-components';

// don't need theming for this file as the colours are the same in dark/light mode (black and white)

export const BannerContent = styled(m.div)`
    position: fixed;
    top: 16px;
    right: 32px;
    z-index: 99999;
    display: flex;
    align-items: center;
    padding: 8px 10px;
    border-radius: 15px;
    max-width: 243px;
    height: 54px;
    background-color: #000;
    color: #fff;
    cursor: pointer;
    pointer-events: all;
    &:hover {
        transform: scale(1.05);
    }
    transition: all 0.2s ease-in-out;
`;

export const FlexWrapper = styled(m.div)`
    display: flex;
    align-items: center;
    overflow: hidden;
`;

export const IconContainer = styled(m.div)`
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: white;
    border-radius: 8px;
    min-width: 38px;
    height: 38px;
`;

export const DateLabel = styled(m.span)`
    color: #ffffffb2;
    font-family: Poppins;
    font-weight: 500;
    font-size: 11px;
    leading-trim: Cap height;
    line-height: 17px;
    letter-spacing: 1%;
`;

export const ContentContainer = styled(m.div)`
    display: flex;
    gap: 2px;
    flex-direction: column;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
`;

export const TitleContainer = styled(m.div)<{ $hasTextOverflow: boolean }>`
    display: flex;
    align-items: center;
    justify-content: space-evenly;
    row-gap: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    position: relative;
    ${({ $hasTextOverflow }) =>
        $hasTextOverflow &&
        css`
            &::before,
            &::after {
                content: '';
                position: absolute;
                top: 0;
                bottom: 0;
                width: 20px;
                z-index: 2;
                pointer-events: none;
            }
            &::before {
                left: 0;
                background: linear-gradient(to right, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%);
            }
            &::after {
                right: 0;
                background: linear-gradient(to left, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%);
            }
        `}
`;

export const Title = styled(m.span)`
    white-space: nowrap;
    max-width: 168px;
    min-width: 100px;
    width: 100%;
    font-family: Poppins;
    font-weight: 500;
    font-size: 12px;
    line-height: 17px;
    letter-spacing: 1%;
`;

export const LiveBadgeWrapper = styled(m.div)`
    display: flex;
    justify-content: space-evenly;
    align-items: center;
    background-color: #ef4444;
    padding: 1px 7px;
    border-radius: 12px;
    gap: 12px;
`;

export const LiveBadgeText = styled(m.div)`
    font-family: Poppins;
    font-weight: 600;
    font-size: 10px;
    leading-trim: Cap height;
    line-height: 17px;
    letter-spacing: 1%;
`;

export const LiveWrapper = styled(m.div)`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    row-gap: 12px;
    column-gap: 12px;
`;

export const JoinSpaceWrapper = styled(m.div)`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    border-radius: 30px;
    border: 1px solid #ffffff33;
    padding: 0px 5px;
    font-family: Poppins;
    font-weight: 600;
    font-size: 10px;
    leading-trim: Cap height;
    line-height: 17px;
    letter-spacing: 1%;
`;
