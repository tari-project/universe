import styled from 'styled-components';
import { m } from 'framer-motion';

export const Wrapper = styled(m.div)`
    border-radius: ${({ theme }) => theme.shape.borderRadius.app};
    background-color: ${({ theme }) => theme.palette.error.main};
    width: 400px;
    max-height: 90px;
    position: absolute;
    padding: 20px;
    display: flex;
    z-index: 100;
    border: 1px solid deeppink;
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
