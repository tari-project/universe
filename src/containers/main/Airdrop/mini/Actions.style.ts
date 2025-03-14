import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';

export const Wrapper = styled.div`
    flex-direction: column;
    display: flex;
    gap: 15px;
`;

export const ActionImgWrapper = styled.div`
    align-items: center;
    flex-direction: column;
    img {
        max-width: 100%;
    }
`;
export const GemImg = styled.img`
    width: 30px;
    transform: scaleX(-1);
`;

export const ActionWrapper = styled.div`
    flex-direction: column;
    max-height: 60px;
    width: 60px;
    padding: 10px 0;
    display: flex;
    align-items: center;
    justify-content: center;
`;

export const ActionText = styled(Typography)`
    color: ${({ theme }) => theme.palette.text.primary};
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
`;
