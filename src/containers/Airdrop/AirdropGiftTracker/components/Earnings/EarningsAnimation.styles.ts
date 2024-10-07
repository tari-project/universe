import styled from 'styled-components';
import { m } from 'framer-motion';

export const Wrapper = styled(m.div)`
    width: 316px;
    position: relative;
    background: #14ae32;
    z-index: 1;
`;
export const Circle = styled(m.div)`
    position: absolute;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 100%;
`;

export const ContentWrapper = styled(m.div)`
    opacity: 1;
    z-index: 5;
    display: flex;
    padding: 20px 0;
    justify-content: space-between;
    align-items: center;
    flex-direction: column;
    position: absolute;
    top: 0;
    left: 0;
    height: 209px;
    width: 100%;
    p {
        font-weight: 500;
    }
`;

export const GemAmount = styled.div`
    display: flex;
    font-family:
        Druk LCG,
        sans-serif;
    color: #000;
    text-align: center;
    font-size: 76px;
    font-weight: 700;
    justify-content: center;
    gap: 6px;
    align-items: center;
    img {
        display: flex;
        height: 60px;
    }
`;
