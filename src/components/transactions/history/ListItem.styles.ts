import styled from 'styled-components';
import * as m from 'motion/react-m';
import { convertHexToRGBA } from '@app/utils';

export const ItemWrapper = styled(m.div)`
    display: flex;
    width: 100%;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.07);
    height: 48px;
    box-shadow: 0 4px 65px 0 ${({ theme }) => convertHexToRGBA(theme.colors.greyscale[500], 0.2)};
`;

export const ContentWrapper = styled.div`
    padding: 12px;
    display: grid;
    place-items: stretch;
    width: 100%;

    grid-template-areas:
        'title . earnings'
        'time . earnings';
`;

export const ValueWrapper = styled.div`
    display: flex;
    grid-area: earnings;
`;
