import { HTMLProps, ReactNode, Ref } from 'react';
import ArrowDown from '@app/assets/icons/ArrowDown.tsx';

import { Variant } from '../types.ts';
import { Content, IconWrapper, Label, SelectedItem, TriggerContent, TriggerCTA } from './styles.ts';

interface TriggerProps extends HTMLProps<HTMLButtonElement> {
    ref: Ref<HTMLButtonElement>;
    children?: ReactNode;
    label?: string;
    variant?: Variant;
    isOpen?: boolean;
}
export const Trigger = ({ ref, children, label, isOpen, variant = 'primary', ...props }: TriggerProps) => {
    const content = (
        <TriggerContent $isOpen={isOpen}>
            {label ? (
                <Content>
                    <Label>{label}</Label>
                </Content>
            ) : null}
            <Content>
                <SelectedItem>{children}</SelectedItem>
            </Content>
        </TriggerContent>
    );

    return (
        <TriggerCTA {...props} ref={ref} $variant={variant} type="button">
            {content}
            <IconWrapper $isOpen={isOpen}>
                <ArrowDown />
            </IconWrapper>
        </TriggerCTA>
    );
};
