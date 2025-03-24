import styled from 'styled-components';
import { convertHexToRGBA } from '@app/utils';
import { Typography } from '@app/components/elements/Typography.tsx';

export const Card = styled.div`
    display: flex;
    padding: 30px;
    flex-direction: column;
    justify-content: center;
    gap: 25px;
    border-radius: 20px;
    background: ${({ theme }) => theme.palette.background.main};
    box-shadow: ${({ theme }) => `20px 20px 145px 0 ${convertHexToRGBA(theme.palette.contrast, 0.7)}`};
    flex: 1;
`;

export const CardTitle = styled(Typography)``;
export const CardSubtitle = styled(Typography)``;
export const CardActionWrapper = styled.div``;
