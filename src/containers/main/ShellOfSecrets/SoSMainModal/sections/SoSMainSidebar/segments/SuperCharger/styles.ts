import styled from 'styled-components';
import backgroundImage from './images/background.png';

export const Wrapper = styled('div')`
    width: 100%;

    display: flex;
    flex-direction: column;
    gap: 30px;
`;

export const TopBar = styled('div')`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 30px;
`;

export const LineLeft = styled('div')`
    width: 100%;
    height: 2px;
    background-color: #e6ff47;
`;

export const SectionLabel = styled('div')`
    color: #e6ff47;
    font-size: 23px;
    font-weight: 500;
    line-height: 129.623%;
    text-transform: uppercase;
    white-space: nowrap;
`;

export const LineRight = styled('div')`
    width: 100%;
    height: 2px;
    background-color: #e6ff47;
`;

export const FormWrapper = styled('form')`
    width: 100%;
    min-height: 101px;
    border: 1px solid #95a663;
    background-color: #314627;
    background-image: url(${backgroundImage});
    background-size: cover;

    padding: 0 30px 0 10px;
    display: flex;
    gap: 20px;
    justify-content: space-between;
    align-items: center;

    svg {
        flex-shrink: 0;
    }
`;

export const InputField = styled('input')`
    width: 100%;
    height: auto;
    min-width: 180px;
    padding: 2px 0 10px 0;

    background-color: transparent;
    border: none;

    color: #fff;
    font-size: 16px;
    font-weight: 700;
    line-height: 100%;

    border-bottom: 1px solid #fff;

    &::placeholder {
        color: #fff;
        opacity: 0.4;
    }

    &:focus {
        outline: none;
        border-bottom: 1px solid #e6ff47;

        &::placeholder {
            opacity: 0.6;
        }
    }
`;

export const SubmitButton = styled('button')`
    width: 81px;

    background: #e6ff47;

    display: flex;
    width: 81px;
    height: 32px;
    padding: 12px;
    justify-content: center;
    align-items: center;
    flex-shrink: 0;

    color: #161e0b;
    font-size: 14px;
    font-weight: 700;
    line-height: 150%;
    text-transform: uppercase;

    transition: transform 0.2s ease;

    &:hover {
        transform: scale(1.05);
    }
`;
