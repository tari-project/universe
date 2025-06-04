import { IconButton } from '@app/components/elements/buttons/IconButton';
import styled from 'styled-components';

export const Wrapper = styled.div`
    display: flex;
    width: min(400px, 60vw);
    align-items: center;
    flex-direction: column;
    gap: 12px;
    position: relative;
`;

export const CopyWrapper = styled.div`
    display: flex;
    width: 100%;
    align-items: center;
    flex-direction: column;
`;

export const CloseButton = styled(IconButton)`
    position: absolute;
    right: 10px;
    top: 10px;
`;
