import styled from 'styled-components';
import * as m from 'motion/react-m';

export const CurrentWrapper = styled.div`
    height: 35px;
`;
export const Content = styled(m.div)`
    display: flex;
    border: 1px solid ${({ theme }) => theme.palette.divider};
    backdrop-filter: blur(4px);
    border-radius: 22px;
    padding: 4px 6px 4px 12px;
    justify-content: space-between;
    align-items: center;
`;

export const TextWrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    font-size: 13px;
    p {
        opacity: 0.5;
        font-size: 11px;
    }
`;
