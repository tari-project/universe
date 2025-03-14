import { ReactNode } from 'react';
import { ActionText, ActionWrapper } from './Action.style.ts';

interface ActionProps {
    children: ReactNode;
    text?: string;
}

export function Action({ children, text }: ActionProps) {
    return (
        <ActionWrapper>
            {children}
            <ActionText>{text}</ActionText>
        </ActionWrapper>
    );
}
