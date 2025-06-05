import styled from 'styled-components';
import { convertHexToRGBA } from '@app/utils';

export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;
export const BalanceWrapper = styled.div`
    display: flex;
    align-items: flex-end;
    color: ${({ theme }) => theme.colors.greyscale[100]};
    font-size: 23px;
    line-height: 26px;
    font-weight: 500;
    letter-spacing: -0.84px;
    gap: 4px;
    vertical-align: bottom;
`;
export const SuffixWrapper = styled.span`
    font-size: 14px;
    font-weight: 600;
    letter-spacing: -0.56px;
    vertical-align: bottom;
    line-height: 26px;
`;
export const AvailableWrapper = styled.div`
    display: flex;
    font-size: 11px;
    font-weight: 500;
    color: ${({ theme }) => convertHexToRGBA(theme.colors.greyscale[100], 0.5)};
`;
