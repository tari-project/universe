import styled from 'styled-components';
import { FloatingOverlay } from '@floating-ui/react';
export const TriggerWrapper = styled.div`
    display: flex;
`;
export const ContentWrapper = styled.div`
    background-color: ${({ theme }) => theme.palette.background.paper};
    border-radius: ${({ theme }) => theme.shape.borderRadius.app};
    box-shadow: 0 4px 45px 0 rgba(0, 0, 0, 0.08);
    display: flex;
    width: 800px;
    padding: 20px;
`;

export const Overlay = styled(FloatingOverlay)`
    display: grid;
    place-items: center;
    background-color: ${({ theme }) => theme.palette.colors.darkAlpha[10]};
`;
