import { HTMLProps, ReactNode, Ref } from 'react';
import { ArrowDown } from '@app/assets/icons/ArrowDown.tsx';

import { Variant } from '../types.ts';
import {
    Content,
    IconWrapper,
    Label,
    SecondaryTriggerContent,
    SelectedItem,
    TriggerContent,
    TriggerCTA,
} from './styles.ts';

interface TriggerProps extends HTMLProps<HTMLButtonElement> {
    ref: Ref<HTMLButtonElement>;
    children?: ReactNode;
    label?: string;
    variant?: Variant;
    isOpen?: boolean;
    selectedMode?: string;
}
export const Trigger = ({
    ref,
    children,
    label,
    isOpen,
    selectedMode,
    variant = 'primary',
    ...props
}: TriggerProps) => {
    const Wrapper = variant === 'secondary' ? SecondaryTriggerContent : TriggerContent;
    return (
        <TriggerCTA {...props} ref={ref} $variant={variant} type="button">
            <Wrapper $selectedMode={selectedMode}>
                <Content>{label ? <Label>{label}</Label> : null}</Content>
                <Content>
                    <SelectedItem>{children}</SelectedItem>
                    <IconWrapper $isOpen={isOpen}>
                        <ArrowDown />
                    </IconWrapper>
                </Content>
            </Wrapper>
        </TriggerCTA>
    );
};
