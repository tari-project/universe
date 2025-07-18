import * as m from 'motion/react-m';
import styled, { css } from 'styled-components';

export const Wrapper = styled(m.div)`
    display: flex;
    transition: scale 0.2s ease;
    pointer-events: all;
    user-select: none;
`;

export const BoxWrapper = styled.div`
    display: flex;
    border: 1px solid #dbd2c9;
    background-color: rgba(204, 204, 203, 0.8);
    border-radius: 100px;

    padding: 6px;
    width: 260px;
    height: 86px;
`;

export const Inside = styled.div`
    display: flex;
    align-items: center;
    gap: 14px;

    background-color: #fff;
    border-radius: 100px;

    padding: 10px 16px;
    width: 100%;
    height: 100%;
`;

export const Divider = styled.div`
    width: 1px;
    height: 44px;
    background-color: #9a9792;
    opacity: 0.2;
`;

export const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

export const BlockTitle = styled.div`
    color: #111;
    font-family: Poppins, sans-serif;
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 119.8%;
    user-select: none;

    strong {
        font-weight: 600;
    }
`;

export const MinersSolved = styled.div`
    display: flex;
    align-items: center;
    gap: 5px;

    color: #3a3835;
    font-family: Poppins, sans-serif;
    font-size: 9px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
    opacity: 0.5;

    span {
        transform: translateY(1px);
    }
`;

export const MetaData = styled.div`
    display: flex;
    align-items: center;
    gap: 5px;
    padding-top: 2px;
`;

export const RewardPill = styled.div<{ $isHovering?: boolean }>`
    border-radius: 100px;
    background: linear-gradient(269deg, #ffa515 -26.57%, #ffdd6c 97.7%);
    user-select: none;

    color: #030303;
    font-family: Poppins, sans-serif;
    font-size: 10px;
    font-style: normal;
    font-weight: 700;
    line-height: normal;
    white-space: nowrap;
    overflow: hidden;

    position: relative;

    display: flex;
    align-items: center;
    justify-content: center;

    height: 20px;
    padding: 0px 8px;
    transition: background 0.2s ease;

    span {
        z-index: 1;
        position: relative;
        transition: transform 0.2s ease;
        display: inline-block;
        transform: translateY(1px);
    }

    ${({ $isHovering }) =>
        $isHovering &&
        css`
            background: linear-gradient(203deg, #e08e69 18.69%, #af72cf 67.59%), rgba(17, 17, 17, 0.1);
            color: #fff;
        `}
`;

export const RewardPillHoverBg = styled(m.div)`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(203deg, #e08e69 18.69%, #af72cf 67.59%), rgba(17, 17, 17, 0.1);
    z-index: 0;
`;

export const TimeAgo = styled.span`
    color: #3a3835;
    font-family: Poppins, sans-serif;
    font-size: 9px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
    opacity: 0.5;
    white-space: nowrap;
`;

export const BottomWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
`;

export const RewardPillBlack = styled.div<{ $isSolved?: boolean }>`
    border-radius: 100px;
    background: #000;
    color: ${(props) => (props.$isSolved ? '#fff' : '#ffdd6c')};
    font-family: Poppins, sans-serif;
    font-size: 11px;
    font-weight: 700;
    padding: 1px 7px 0 7px;
    white-space: nowrap;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
`;
