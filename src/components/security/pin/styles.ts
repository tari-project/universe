import styled from 'styled-components';
import { convertHexToRGBA } from '@app/utils';

export const Wrapper = styled.form`
    display: flex;
    width: 100%;
    justify-content: space-between;
`;

export const DigitWrapper = styled.input`
    display: flex;
    width: 80px;
    height: 110px;
    border-radius: 20px;

    border: 1px solid ${({ theme }) => theme.palette.divider};
    background: ${({ theme }) => theme.palette.background.paper};
    box-shadow: 0 0 25px 0 ${({ theme }) => convertHexToRGBA(theme.palette.contrast, 0.1)};
    align-items: center;
    justify-content: center;
    font-size: 48px;
    font-weight: 500;
    text-align: center;
`;
