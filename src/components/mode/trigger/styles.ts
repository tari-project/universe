import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Variant } from '../types.ts';

interface Props {
    $variant?: Variant;
    $isOpen?: boolean;
}

export const TriggerCTA = styled.button<Props>`
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    width: 100%;
    border: 1px solid deeppink;
`;

export const Content = styled.div<Props>`
    display: flex;
    width: 100%;
`;

export const Label = styled(Typography)<Props>``;

export const SelectedItem = styled.div<Props>`
    display: flex;
    width: 100%;
`;
