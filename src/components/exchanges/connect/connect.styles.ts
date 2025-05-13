import styled from 'styled-components';
import { convertHexToRGBA } from '@app/utils';

export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    padding: 25px;
    border-radius: 25px;
    background-color: ${({ theme }) => convertHexToRGBA(theme.palette.contrast, 0.025)};
    border: 1px solid ${({ theme }) => convertHexToRGBA(theme.palette.contrast, 0.05)};
    gap: 9px;
`;

export const CTA = styled.button<{ $backgroundCol?: string }>`
    background-color: ${({ $backgroundCol, theme }) => $backgroundCol || theme.palette.action.background};
    box-shadow: 20px 20px 54px 0 rgba(0, 0, 0, 0.1);
    border-radius: 110px;
    height: 50px;
    padding: 0 30px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:disabled {
        opacity: 0.6;
        pointer-events: none;
    }
`;

export const CTAText = styled.div`
    color: #fff;
    text-align: center;
    font-size: 14px;
    font-style: normal;
    font-weight: 600;
    line-height: 0.97;
`;

export const ConnectForm = styled.form`
    display: flex;
    flex-direction: column;
    width: 100%;
`;

export const AddressInputWrapper = styled.div`
    gap: 10px;
    display: flex;
    margin: 0 0 15px;
    position: relative;
`;
export const AddressInputLabel = styled.div`
    color: ${({ theme }) => theme.palette.text.secondary};
    font-size: 12px;
    font-weight: 500;
`;
export const AddressInput = styled.input`
    width: 100%;
    padding: 4px 34px 4px 0;
    border-bottom: 1px solid ${({ theme }) => convertHexToRGBA(theme.palette.contrast, 0.05)};
    &:focus {
        outline: none;
        border-bottom: 1px solid ${({ theme }) => convertHexToRGBA(theme.palette.contrast, 0.1)};
    }
`;
