import styled from 'styled-components';

export type MiningTimeVariant = 'primary' | 'mini';

export const Wrapper = styled.div`
    display: flex;
`;
export const MiniWrapper = styled.div`
    width: 100%;
    gap: 3px;
    display: flex;
    align-items: center;
    color: ${({ theme }) => theme.palette.text.contrast};
    background-color: ${({ theme }) => theme.palette.contrast};
    padding: 2px 7px;
    border-radius: 50px;
    line-height: 1;
    font-weight: 500;
`;

export const TimerDot = styled.div`
    border-radius: 50%;
    background-color: #33cd7e;
    width: 7px;
    height: 7px;
`;
