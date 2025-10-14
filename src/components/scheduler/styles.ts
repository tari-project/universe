import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';

export const Wrapper = styled.div`
    display: flex;
    width: clamp(50vw, 618px, 60vw);
    padding: 0 20px 20px;
    gap: 20px;
    flex-direction: column;
`;

export const Text = styled(Typography)`
    font-size: 16px;
`;

export const FormWrapper = styled.div`
    display: flex;
    width: 100%;
    align-items: stretch;
    justify-content: stretch;
    gap: 20px;
`;
