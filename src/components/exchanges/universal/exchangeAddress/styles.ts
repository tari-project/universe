import { Input } from '@app/components/elements/inputs/Input';
import styled from 'styled-components';

export const StyledInputWrapper = styled.div`
    position: relative;
    display: inline-block;
    width: 100%;
`;

export const StyledInput = styled(Input)`
    border-radius: 20px;
    justify-content: space-between;
    padding: 10px;
    padding-left: 30px;
    padding-right: 40px;
    margin: 10px;
    width: 100%;
`;

export const ClearIcon = styled.div`
    position: absolute;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    cursor: pointer;
    width: 30px;
    height: 30px;
    font-size: 24px;
    opacity: 0.6;
    background-color: #0000001a;
    border-radius: 50%;

    &:hover {
        opacity: 1;
    }

    &::before,
    &::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 12px;
        height: 2px;
        background-color: #000;
    }

    &::before {
        transform: translate(-50%, -50%) rotate(45deg);
    }

    &::after {
        transform: translate(-50%, -50%) rotate(-45deg);
    }
`;

export const CheckmarkIcon = styled.div`
    position: absolute;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    cursor: pointer;
    width: 30px;
    height: 30px;
    font-size: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #009e54;
    border-radius: 50%;
    color: white;

    &::before {
        content: '✓';
        font-weight: bold;
        font-size: 16px;
        line-height: 1;
    }
`;

export const StyledForm = styled.form`
    width: 100%;
`;
