import styled from 'styled-components';
import * as m from 'motion/react-m';

export const WalletWrapper = styled(m.div)`
    background: ${({ theme }) => (theme.mode === 'dark' ? '#2E2E2E' : '#E9E9E9')};
    flex-direction: column;
    border-radius: 20px;
    display: flex;
    padding: 10px;
    gap: 6px;
`;

export const TabsWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 40px;
`;
