import * as m from 'motion/react-m';
import styled from 'styled-components';

export const Wrapper = styled(m.div)`
    display: flex;
    flex-direction: column;
    gap: 20px;
    height: 100%;
    min-height: 0;
`;

export const IntroTextWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;

    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 20px;
`;

export const Title = styled.div`
    color: #fff;
    font-family: Poppins, sans-serif;
    font-size: 22px;
    font-style: normal;
    font-weight: 700;
    line-height: 129.623%;
`;

export const Text = styled.div`
    color: #fff;
    font-family: Poppins, sans-serif;
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 125%;
    opacity: 0.87;

    strong {
        font-weight: 700;
        opacity: 1;
    }
`;
