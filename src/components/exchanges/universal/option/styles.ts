import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';
import { convertHexToRGBA } from '@app/utils';

export const Wrapper = styled.div<{ $isCurrent?: boolean }>`
    display: flex;
    border-radius: 10px;
    width: 100%;
    flex-direction: column;
    align-items: center;
    border: 1px solid
        ${({ theme, $isCurrent: isCurrent }) => (isCurrent ? theme.colors.green[400] : theme.palette.divider)};
    background-color: ${({ theme, $isCurrent: isCurrent }) =>
        isCurrent ? convertHexToRGBA(theme.colors.green[400], 0.1) : theme.palette.background.paper};
    padding: 15px;
    min-height: 70px;
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
`;

export const ContentBodyWrapper = styled.div<{ $isActive?: boolean }>`
    display: flex;
    justify-content: space-evenly;
    align-items: center;
    flex-direction: column;
    width: 100%;
    gap: 15px;
    padding: ${({ $isActive }) => ($isActive ? `14px 0 0 0` : 0)};
    overflow: hidden;
    max-height: ${({ $isActive: $isActive }) => ($isActive ? '1000px' : '0')};
    opacity: ${({ $isActive: $isActive }) => ($isActive ? '1' : '0')};
    transition:
        max-height 0.2s linear,
        opacity 0.2s linear;
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
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    width: 100%;
`;

export const SeasonRewardIcon = styled.img`
    width: 32px;
    height: 32px;
`;

export const SeasonRewardText = styled(Typography).attrs({ variant: 'p' })`
    color: black;
    line-height: 15px;
`;

export const Countdown = styled.div`
    border-radius: 20px;
    gap: 10px;
    padding: 5px 12px;
    background-color: #1111110d;
`;

export const CountdownText = styled(Typography).attrs({ variant: 'p' })`
    color: black;
    font-weight: 700;
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
