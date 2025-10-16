import * as m from 'motion/react-m';
import styled from 'styled-components';

export const OptionsList = styled(m.div)`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    flex: 1 1 auto;
    border-radius: 10px;
    width: 100%;
    box-shadow: 0 16px 30px 0 rgba(0, 0, 0, 0.25);
    background: ${({ theme }) => theme.palette.background.tooltip};
    backdrop-filter: blur(12px);
    padding: 10px;
    gap: 4px;
`;
