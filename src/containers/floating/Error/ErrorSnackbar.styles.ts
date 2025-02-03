import styled from 'styled-components';
import * as m from 'motion/react-m';

export const Wrapper = styled(m.div)`
    position: fixed;
    bottom: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    z-index: 1000;
`;

export const SnackWrapper = styled.div`
    border-radius: ${({ theme }) => theme.shape.borderRadius.app};
    background-color: ${({ theme }) => theme.palette.error.main};
    max-width: 420px;
    min-width: 300px;
    width: auto;
    max-height: 90px;
    position: relative;
    padding: 20px;
    display: flex;
`;
export const ContentWrapper = styled.div`
    display: flex;
    color: ${({ theme }) => theme.palette.text.contrast};
    justify-content: space-between;
    width: 100%;
    font-size: 14px;
    position: relative;
    white-space: pre-wrap;
`;

export const ButtonWrapper = styled.div`
    position: absolute;
    top: 4px;
    color: ${({ theme }) => theme.palette.text.contrast};
    right: 4px;
`;
