import styled from 'styled-components';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';

export const Wrapper = styled.div`
    display: flex;
    width: clamp(45vw, 618px, 55vw);
    padding: 0 20px 10px;
    flex-direction: column;
    justify-content: space-between;
    gap: 10px;
`;

export const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

export const Text = styled(Typography)`
    font-size: 16px;
    opacity: 0.75;
`;

export const FormWrapper = styled.div`
    display: flex;
    width: 100%;
    gap: 5px;
    height: 80px;
    margin: 30px 0 0;
`;

export const CTA = styled(Button)`
    height: min(80px, 10vh);
    font-size: 21px;
    margin: 0 0 10px;
`;

export const CTAText = styled(Typography)`
    font-weight: 600;
`;

export const CurrentWrapper = styled.div`
    display: flex;
    border: 1px solid ${({ theme }) => theme.palette.divider};
    border-radius: 10px;
    padding: 10px;
`;
