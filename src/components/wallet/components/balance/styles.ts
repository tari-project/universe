import styled from 'styled-components';
import { convertHexToRGBA } from '@app/utils';

export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;
export const BalanceWrapper = styled.div`
    display: flex;
    font-size: 18px;
    color: ${({ theme }) => theme.palette.text.primary};
    vertical-align: bottom;
    letter-spacing: -0.4px;
`;
export const AvailableWrapper = styled.div`
    display: flex;
    font-size: 11px;
    font-weight: 500;
    color: ${({ theme }) => convertHexToRGBA(theme.palette.contrast, 0.5)};
`;
