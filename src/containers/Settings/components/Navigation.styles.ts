import styled from 'styled-components';
import { Button } from '@app/components/elements/buttons/Button.tsx';

export const Container = styled.div`
    padding: 30px;
    display: flex;
    background: ${({ theme }) => theme.palette.background.default};
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    width: 250px;

    @media (max-width: 1110px) {
        width: 220px;
    }
`;

export const ButtonContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    gap: 10px;
`;

export const SectionButton = styled(Button)`
    display: flex;
    text-transform: capitalize;
    cursor: pointer;
`;
