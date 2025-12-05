import styled from 'styled-components';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';

export const Wrapper = styled.div`
    display: flex;
    width: clamp(45vw, 618px, 55vw);
    padding: 0 20px;
    flex-direction: column;
    justify-content: space-between;
    gap: min(14px, 4vh);
`;

export const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

export const TextWrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

export const Text = styled(Typography)`
    font-size: 15px;
    opacity: 0.75;
`;

export const FormWrapper = styled.div`
    display: flex;
    width: 100%;
    gap: 5px;
    height: 80px;
    margin: min(25px, 3.4vh) 0 0;
`;

export const CTA = styled(Button)`
    height: min(80px, 9.5vh);
    font-size: 21px;
`;

export const CTAText = styled(Typography)`
    font-weight: 600;
`;
