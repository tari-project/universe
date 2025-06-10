import styled from 'styled-components';
import NumberFlow from '@number-flow/react';

export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;
export const StyledNumberFlow = styled(NumberFlow)`
    display: flex;
    font-size: 23px;
    line-height: 26px;
    height: 26px;
    font-weight: 500;
    letter-spacing: -0.84px;
    text-transform: lowercase;
`;
export const Hidden = styled.div`
    font-size: 26px;
    line-height: 1;
    letter-spacing: 3px;
`;
export const BalanceWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
`;
export const BalanceTextWrapper = styled.div`
    display: flex;
    vertical-align: bottom;
    align-items: flex-end;
    gap: 4px;
    color: ${({ theme }) => theme.colors.greyscale[100]};
`;
export const SuffixWrapper = styled.span`
    font-size: 14px;
    line-height: 1;
    font-weight: 600;
    display: flex;
    letter-spacing: -0.56px;
`;
export const AvailableWrapper = styled.div`
    display: flex;
    font-size: 11px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.greyscale[150]};
`;
