import { IconButton } from '@app/components/elements/buttons/IconButton';
import styled from 'styled-components';

export const Wrapper = styled.div`
    display: flex;
    width: min(420px, 60vw);
    align-items: center;
    flex-direction: column;
    gap: 10px;
    padding-top: 10px;
    position: relative;
`;

export const HeaderWrapper = styled.div`
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: center;
`;

export const CopyWrapper = styled.div`
    display: flex;
    width: 100%;
    justify-content: center;
    align-items: center;
    flex-direction: row;
    gap: 8px;
    white-space: pre;
    font-size: 13px;
    padding: 10px 0;
    opacity: 0.85;
`;

export const CloseButton = styled(IconButton)`
    position: absolute;
    right: 10px;
    top: 10px;
`;
