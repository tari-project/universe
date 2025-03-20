import styled from 'styled-components';
import { Button } from '@app/components/elements/buttons/Button.tsx';

export const Container = styled.div`
    padding: 32px 15px 15px;
    display: flex;
    background: ${({ theme }) => theme.palette.background.default};
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    height: 100%;
    width: 250px;

    @media (max-width: 1200px) {
        width: 220px;
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

export const TermsBtn = styled.button`
    display: flex;
    justify-content: center;
    gap: 3px;
    color: ${({ theme }) => theme.palette.text.accent};
    transition: color 0.3s linear;
    font-weight: 500;
    font-size: 13px;
    &:hover {
        color: ${({ theme }) => theme.palette.text.secondary};
    }
`;
