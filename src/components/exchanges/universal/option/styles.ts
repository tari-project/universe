import styled, { css } from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';
import * as m from 'motion/react-m';

export const Wrapper = styled.div<{ $isCurrent?: boolean; $isActive?: boolean }>`
    display: flex;
    border-radius: 10px;
    width: 100%;
    flex-direction: column;
    align-items: center;
    border: 1px solid
        ${({ theme, $isCurrent: isCurrent }) => (isCurrent ? theme.colors.green[400] : theme.palette.divider)};
    padding: 15px;
    height: ${({ $isActive }) => ($isActive ? 'auto' : '70px')};

    ${({ theme, $isCurrent }) =>
        $isCurrent
            ? css`
                  background: ${theme.mode === 'dark'
                      ? `linear-gradient(-99deg, #1a2d28 8.49%, #233c34 100.54%), #1a2d28`
                      : `linear-gradient(99deg, #10C6712F 2.49%, #10C6712D 45%), #fff`};
              `
            : css`
                  background: ${theme.palette.background.paper};
              `}
`;

export const Heading = styled(Typography).attrs({ variant: 'h5' })`
    line-height: 1.2;
    letter-spacing: -1px;
`;

export const ContentHeaderWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    cursor: pointer;
    transition: opacity 0.2s ease-in-out;
    &:hover {
        opacity: 0.6;
    }
`;

export const ContentBodyWrapper = styled(m.div)`
    display: flex;
    justify-content: space-evenly;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
    width: 100%;
    gap: 14px;
    padding-top: 14px;
`;

export const XCContent = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
`;

export const CaptionWrapper = styled.div`
    border-radius: 30px;
    gap: 5px;
    padding: 9px;
    background-color: #188750;
`;

export const CaptionText = styled(Typography).attrs({ variant: 'p' })`
    color: white;
`;

export const SelectOptionWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

export const SeasonReward = styled.div`
    display: flex;
    justify-content: space-between;
    gap: 10px;
    width: 100%;
`;

export const LeftContent = styled.div`
    display: flex;
    gap: 10px;
`;

export const SeasonRewardIcon = styled.img`
    width: 32px;
    height: 32px;
    display: flex;
`;

export const SeasonRewardText = styled(Typography).attrs({ variant: 'p' })`
    line-height: 15px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    b {
        font-weight: 700;
    }
    span {
        color: ${({ theme }) => theme.palette.text.secondary};
    }
`;

export const Countdown = styled.div`
    border-radius: 20px;
    gap: 10px;
    padding: 5px 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background-color: ${({ theme }) => theme.palette.background.main};
    max-height: 30px;
`;

export const CountdownText = styled(Typography).attrs({ variant: 'p' })`
    font-weight: 700;
    line-height: 1;
`;

export const ConfirmButton = styled.button`
    height: 50px;
    width: 100%;
    border-radius: 111px;
    background-color: #5841d8;
    color: white;
    font-weight: bold;
    cursor: pointer;
    text-align: center;
`;

export const HelpButtonWrapper = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
    gap: 4px;
`;
export const HelpButton = styled.button`
    display: flex;
    align-items: center;
    align-self: flex-start;
    gap: 4px;
    color: #1457ff;
    font-weight: 500;
    font-size: 12px;

    svg {
        width: 10px;
    }

    &:hover {
        opacity: 0.7;
    }
`;
