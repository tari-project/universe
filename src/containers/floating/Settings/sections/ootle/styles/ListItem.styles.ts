import styled from 'styled-components';
import * as m from 'motion/react-m';
import { Typography } from '@app/components/elements/Typography.tsx';
import { convertHexToRGBA } from '@app/utils';

export const ItemWrapper = styled(m.div)`
    display: flex;
    align-items: center;
    width: 100%;
    border-radius: 10px;
    padding: 6px 0;
    flex-direction: column;
    overflow: hidden;
    position: relative;
    box-shadow: ${({ theme }) => `${convertHexToRGBA(theme.palette.contrast, 0.025)} 0 1px 2px -1px`};
    background-color: ${({ theme }) => (theme.mode === 'dark' ? '#1B1B1B' : theme.palette.background.paper)};
`;

export const ContentWrapper = styled.div`
    width: 100%;
    padding: 0 12px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    height: 100%;
`;

export const Content = styled.div`
    display: flex;
    gap: 4px;
    flex-direction: row;
    align-items: center;
    height: 100%;
`;

export const TitleWrapper = styled(Typography)`
    display: flex;
    color: ${({ theme }) => theme.palette.text.primary};

    font-size: 12px;
    font-weight: 500;
    line-height: 1.3;
    letter-spacing: -0.24px;
`;
