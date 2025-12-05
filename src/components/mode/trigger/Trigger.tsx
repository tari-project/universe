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
import { getModeColours } from '@app/components/mode/helpers.ts';
import { MiningModeType } from '@app/types/configs.ts';

interface TriggerProps extends HTMLProps<HTMLButtonElement> {
    ref: Ref<HTMLButtonElement>;
    children?: ReactNode;
    label?: string;
    variant?: Variant;
    isOpen?: boolean;
    selectedMode: MiningModeType;
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
    const isSecondary = variant === 'secondary';
    let styles;
    const Wrapper = isSecondary ? SecondaryTriggerContent : TriggerContent;

    if (isSecondary) {
        const colours = getModeColours(selectedMode);
        styles = {
            background: `radial-gradient(ellipse at -10% 150%, ${colours.light} -25%, transparent 65%),
        radial-gradient(ellipse at 90% 120%, ${colours.accent} -45%, transparent 60%) ${colours.base}`,
        };
    }

    return (
        <TriggerCTA {...props} ref={ref} $variant={variant} type="button">
            <Wrapper style={styles}>
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
