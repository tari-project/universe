import { HTMLProps, ReactNode, Ref } from 'react';
import { Variant } from '../types.ts';
import { Content, Label, SelectedItem, TriggerCTA } from './styles.ts';

interface TriggerProps extends HTMLProps<HTMLButtonElement> {
    ref: Ref<HTMLButtonElement>;
    children?: ReactNode;
    label?: string;
    variant?: Variant;
}
export const Trigger = ({ ref, children, label, variant = 'primary', ...props }: TriggerProps) => {
    return (
        <TriggerCTA {...props} ref={ref} $variant={variant} type="button">
            {label ? (
                <Content>
                    <Label>{label}</Label>
                </Content>
            ) : null}
            <Content>
                <SelectedItem>{children}</SelectedItem>
            </Content>
        </TriggerCTA>
    );
};
