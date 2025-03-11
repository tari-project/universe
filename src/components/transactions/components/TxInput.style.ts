import styled from 'styled-components';

export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    position: relative;
    width: 100%;
    padding: 4px;
`;
export const StyledInput = styled.input<{ $hasIcon?: boolean }>`
    display: flex;
    padding: ${({ $hasIcon }) => ($hasIcon ? `6px 0 6px 40px` : `6px 0 6px`)};
    width: 100%;
    font-size: 1.4rem;
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
export const ContentWrapper = styled.div<{ $hasError?: boolean }>`
    display: flex;
    position: relative;
    width: 100%;
    border-bottom: ${({ $hasError, theme }) =>
        $hasError ? `1px solid ${theme.palette.error.main}` : '1px solid transparent'};
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

export const ErrorMessage = styled.div`
    height: 0.8rem;
    color: ${({ theme }) => theme.palette.error.main};
`;
