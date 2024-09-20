import styled from 'styled-components';
import { ButtonBase } from '@app/components/elements/buttons/ButtonBase.tsx';

export const Container = styled.div`
    padding: 30px;
    display: flex;
    background: ${({ theme }) => theme.palette.background.default};
    flex-direction: column;
    align-items: center;
    height: 100%;
    width: 250px;
    gap: 10px;
`;

export const SectionButton = styled(ButtonBase)`
    display: flex;
    text-transform: capitalize;
`;
