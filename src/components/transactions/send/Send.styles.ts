import styled from 'styled-components';
import { convertHexToRGBA } from '@app/utils';

export const StyledForm = styled.form`
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: space-between;
    width: 100%;
    height: 100%;
`;

export const FormFieldsWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: stretch;
`;

export const BottomWrapper = styled.div`
    display: flex;
    gap: 8px;
    flex-direction: column;
    justify-content: flex-end;
`;

export const SendDivider = styled.div`
    width: 100%;
    display: flex;
    justify-content: center;
    position: relative;

    &:before,
    &:after {
        content: '';
        height: 1px;
        position: absolute;
        width: 40%;
        top: 50%;
        background: ${({ theme }) => convertHexToRGBA(theme.palette.contrast, 0.075)};
    }

    &:before {
        left: 0;
    }
    &:after {
        right: 0;
    }
`;

export const DividerIcon = styled.div`
    width: 36px;
    height: 36px;
    background: linear-gradient(0deg, #040723 4%, #071e6b 120%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
`;

export const ErrorMessageWrapper = styled.div`
    display: flex;
    align-items: center;
    flex-direction: column;

    color: ${({ theme }) => theme.palette.warning.dark};
`;
