import styled from 'styled-components';
import * as m from 'motion/react-m';

export const CurrentWrapper = styled.div`
    height: min(50px, 5vh);
`;
export const Content = styled(m.div)`
    display: flex;
    border: 1px solid ${({ theme }) => theme.palette.divider};
    backdrop-filter: blur(4px);
    border-radius: 22px;
    padding: 5px 6px 5px 12px;
    justify-content: space-between;
    align-items: center;
`;

export const TextWrapper = styled.div`
    display: flex;
    flex-direction: column;
    font-size: 0.8rem;
    justify-content: center;
    p {
        opacity: 0.5;
        font-size: 0.68rem;
        line-height: 1;
    }
    strong {
        font-weight: 600;
    }
`;
