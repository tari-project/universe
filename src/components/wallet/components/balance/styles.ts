import styled from 'styled-components';

export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
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
    gap: 4px;
    color: ${({ theme }) => theme.colors.greyscale[100]};
    font-size: 23px;
    line-height: 26px;
    align-items: flex-end;
    font-weight: 500;
    letter-spacing: -0.84px;
    text-transform: lowercase;
    vertical-align: bottom;
`;
export const SuffixWrapper = styled.span`
    font-size: 14px;
    font-weight: 600;
    line-height: 26px;
    display: flex;
    margin-bottom: 2px;
    letter-spacing: -0.56px;
`;
export const AvailableWrapper = styled.div`
    display: flex;
    font-size: 11px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.greyscale[150]};
`;
