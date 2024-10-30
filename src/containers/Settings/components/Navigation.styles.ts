import styled from 'styled-components';
import { Button } from '@app/components/elements/buttons/Button.tsx';

export const Container = styled.div`
    padding: 32px 15px;
    display: flex;
    background: ${({ theme }) => theme.palette.background.default};
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    width: 230px;

    @media (max-width: 1200px) {
        width: 200px;
    }
`;

export const ButtonContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    width: 100%;
    gap: 10px;
`;

export const SectionButton = styled(Button)`
    display: flex;
    text-transform: capitalize;
    cursor: pointer;
`;
