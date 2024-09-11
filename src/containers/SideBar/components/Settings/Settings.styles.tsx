import styled from 'styled-components';
import { Stack } from '@app/components/elements/Stack.tsx';

export const HorisontalBox = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    align-items: center;
    gap: 6px;
    justify-items: start;
    width: 100%;
`;

export const CardContainer = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
`;

export const CardItem = styled(Stack)`
    padding: 15px;
    background-color: ${({ theme }) => theme.palette.background.paper};
    border-radius: ${({ theme }) => theme.shape.borderRadius.app};
    color: ${({ theme }) => theme.palette.text.secondary};
    box-shadow: 0 4px 45px 0 rgba(0, 0, 0, 0.08);
`;

export const Form = styled.form`
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 6px;
`;

export const HeadingContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 20px;
    width: 100%;
    border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
`;
