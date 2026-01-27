import { m } from 'motion/react';
import styled from 'styled-components';
import { SB_WIDTH } from '@app/theme/styles.ts';

export const SidebarWrapper = styled(m.div)`
    background: ${({ theme }) => theme.palette.background.default};
    box-shadow: 0 0 45px 0 rgba(0, 0, 0, 0.15);
    border-radius: 20px;
    padding: 12px;
    width: ${SB_WIDTH}px;
`;

export const SidebarContent = styled.div`
    display: flex;
    height: 100%;
    flex-direction: column;
    justify-content: space-between;
    gap: 20px;
`;
