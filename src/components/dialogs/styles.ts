import styled from 'styled-components';
import { Button } from '@app/components/elements/buttons/Button.tsx';

export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: clamp(420px, 40vw, 540px);
    padding: 10px;
    align-items: center;
`;

export const Content = styled.div`
    display: flex;
    text-align: left;
    align-items: center;
    color: ${({ theme }) => theme.palette.text.primary};
    justify-content: center;
    font-size: clamp(10px, 0.8rem + 0.1vw, 16px);
    gap: 10px;
    img {
        display: flex;
        height: 24px;
    }
`;
export const CTAWrapper = styled.div`
    display: flex;
    padding: 6px 0 0 0;
    width: 70%;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
`;

export const StyledCTA = styled(Button).attrs({
    fluid: true,
    size: 'small',
})``;
