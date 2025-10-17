import styled from 'styled-components';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';

export const Wrapper = styled.div`
    display: flex;
    width: clamp(50vw, 618px, 60vw);
    padding: 0 20px 20px;
    gap: 10px;
    flex-direction: column;
`;

export const Text = styled(Typography)`
    font-size: 16px;
    opacity: 0.75;
`;

export const FormWrapper = styled.div`
    display: flex;
    width: 100%;
    align-items: stretch;
    justify-content: stretch;
    gap: 5px;
    padding: 20px 0;
`;

export const CTA = styled(Button)`
    height: min(80px, 10vh);
    font-size: 21px;
`;
