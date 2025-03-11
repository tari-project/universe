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
    padding: ${({ $hasIcon }) => ($hasIcon ? `10px 0 10px 28px` : `10px 0`)};
    width: 100%;
    opacity: 0.9;
    &:focus {
        outline: none;
        opacity: 1;
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
    width: 18px;
    height: 18px;
    position: absolute;
    transform: translateY(-50%);
    top: 50%;
    left: 4px;
`;
