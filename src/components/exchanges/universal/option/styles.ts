import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';
import { convertHexToRGBA } from '@app/utils';

export const Wrapper = styled.div<{ $isCurrent?: boolean }>`
    display: flex;
    border-radius: 10px;
    width: 100%;
    flex-direction: column;
    border: 1px solid ${({ theme, $isCurrent }) => ($isCurrent ? theme.colors.green[400] : theme.palette.divider)};
    background-color: ${({ theme, $isCurrent }) =>
        $isCurrent ? convertHexToRGBA(theme.colors.green[400], 0.1) : theme.palette.background.paper};
    padding: 15px;
    gap: 14px;
`;

export const Heading = styled(Typography).attrs({ variant: 'h5' })`
    line-height: 1.2;
    letter-spacing: -1px;
`;

export const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`;

export const ContentHeaderWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
`;

export const Dot = styled.div`
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background-color: #b6b7c3;
`;

export const DotContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 2px;
    margin: 0 4px;
`;

export const ContentBodyWrapper = styled.div<{ $isActive?: boolean }>`
    display: flex;
    justify-content: space-evenly;
    align-items: center;
    flex-direction: column;
    width: 100%;
    gap: 15px;
    overflow: hidden;
    max-height: ${({ $isActive }) => ($isActive ? '1000px' : '0')};
    opacity: ${({ $isActive }) => ($isActive ? '1' : '0')};
    transition:
        max-height 0.3s ease,
        opacity 0.3s ease;
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

export const SeasonRewardText = styled(Typography).attrs({ variant: 'p' })`
    color: black;
    fontweight: 700;
`;

export const Countdown = styled.div`
    border-radius: 20px;
    gap: 10px;
    padding-top: 5px;
    padding-right: 12px;
    padding-bottom: 5px;
    padding-left: 12px;
    background-color: #1111110d;
`;

export const CountdownText = styled(Typography).attrs({ variant: 'p' })`
    color: black;
    fontweight: 700;
`;

export const SeasonRewardIcon = styled.img`
    width: 24px;
    height: 24px;
`;

export const ConfirmButton = styled.button`
    border-radius: 112px;
    padding: 20px 20px;
    background-color: #5841d8;
    color: white;
    font-weight: bold;
    cursor: pointer;
    width: 100%;
    text-align: center;
`;
