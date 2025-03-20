import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';
import { convertHexToRGBA } from '@app/utils';

export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    position: relative;
    width: 100%;
    padding: 20px 10px;
    border-radius: 10px;
    box-shadow: ${({ theme }) => `${convertHexToRGBA(theme.palette.contrast, 0.1)} 0 1px 4px -3px inset`};
`;

export const AccentWrapper = styled.div`
    position: absolute;
    top: 0;
    left: 50%;
    transform: translate(-50%, -50%);
`;

export const StyledInput = styled.input<{ $hasIcon?: boolean }>`
    display: flex;
    padding: ${({ $hasIcon }) => ($hasIcon ? `6px 0 6px 34px` : `6px 0 6px`)};
    width: 100%;
    font-size: 1.4rem;
    letter-spacing: -1px;
    font-weight: 500;
    opacity: 0.9;
    &:focus {
        outline: none;
        opacity: 1;
    }
    &::placeholder {
        color: ${({ theme }) => theme.palette.text.shadow};
        font-size: 1.4rem;
    }
`;
export const ContentWrapper = styled.div`
    display: flex;
    position: relative;
    width: 100%;
`;
export const IconWrapper = styled.div`
    display: flex;
    align-items: center;
    width: 26px;
    height: 26px;
    position: absolute;
    transform: translateY(-50%);
    top: 50%;
`;

export const Label = styled(Typography).attrs({ variant: 'p' })`
    color: ${({ theme }) => theme.palette.text.accent};
    font-weight: 500;
`;
