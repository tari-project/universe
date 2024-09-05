import { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { useKeyboardEvent } from '@app/hooks/helpers/useKeyboardEvent.ts';

const Content = styled.div<{ $isNested?: boolean }>`
    max-height: 90%;
    min-height: 160px;
    min-width: ${({ $isNested }) => ($isNested ? 'max-content' : '60%')};
    background-color: ${({ theme }) => theme.palette.background.paper};
    border-radius: ${({ theme }) => theme.shape.borderRadius.app};
    box-shadow: 0 4px 45px 0 rgba(0, 0, 0, 0.08);
    display: flex;
    padding: 20px;
    overflow-y: scroll;
    //z-index: ${({ $isNested }) => ($isNested ? 2 : 1)};
    position: relative;
`;
const Backdrop = styled.div<{ $isNested?: boolean }>`
    width: 100%;
    position: absolute;
    background: rgba(0, 0, 0, 0.5);
    //z-index: ${({ $isNested }) => ($isNested ? 1 : 0)};
    height: 100%;
`;
const Wrapper = styled.div<{ $isNested?: boolean }>`
    pointer-events: auto;
    width: 100vw;
    top: 0;
    left: 0;
    height: 100vh;
    position: fixed;
    display: flex;
    align-items: center;
    justify-content: center;
    //z-index: 10;
`;

interface Props {
    children: ReactNode;
    onClose: (e?) => void;
    isNested?: boolean;
    open?: boolean;
}

function ModalContent({ onClose, children, isNested, open }: Props) {
    useKeyboardEvent({ keys: ['Escape'], callback: onClose });

    return (
        <Wrapper $isNested={isNested}>
            <Backdrop $isNested={isNested} />
            <Content $isNested={isNested}>{children}</Content>
        </Wrapper>
    );
}

export default function Dialog({ onClose, children, open = false, isNested = false }: Props) {
    return (
        <>
            {open &&
                createPortal(
                    <ModalContent onClose={onClose} open={open} isNested={isNested}>
                        {children}
                    </ModalContent>,
                    document.body
                )}
        </>
    );
}
