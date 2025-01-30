import { HiOutlineSelector } from 'react-icons/hi';
import { useEffect, useState } from 'react';
import { Typography } from '@app/components/elements/Typography.tsx';

import CheckSvg from '@app/components/svgs/CheckSvg.tsx';

import {
    IconWrapper,
    OptionLabelWrapper,
    Options,
    SelectedOption,
    StyledOption,
    TriggerWrapper,
    Wrapper,
} from './Select.styles.ts';
import { autoUpdate, useClick, useDismiss, useFloating, useInteractions, useRole } from '@floating-ui/react';
import { SpinnerIcon } from '@app/components/elements/loaders/SpinnerIcon.tsx';

export interface SelectOption {
    label: string;
    selectedLabel?: string;
    iconSrc?: string;
    value: string;
}

type SelectVariant = 'primary' | 'bordered';
interface Props {
    options: SelectOption[];
    onChange: (value: SelectOption['value']) => void;
    selectedValue?: SelectOption['value'];
    variant?: SelectVariant;
    disabled?: boolean;
    loading?: boolean;
    forceHeight?: number;
}

export function Select({
    options,
    selectedValue,
    disabled,
    loading,
    onChange,
    variant = 'primary',
    forceHeight,
}: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const isBordered = variant === 'bordered';

    const { update, refs, elements, context } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
    });

    useEffect(() => {
        if (isOpen && elements.reference && elements.floating) {
            return autoUpdate(elements.reference, elements.floating, update, {
                layoutShift: false,
                ancestorResize: false,
            });
        }
    }, [isOpen, elements, update]);

    function handleChange(value: string, disableClick = false) {
        if (disableClick) return;
        onChange(value);
        setIsOpen(false);
    }
    const click = useClick(context);
    const dismiss = useDismiss(context);
    const role = useRole(context);

    const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role]);

    const selectedOption = selectedValue ? options.find((o) => o.value === selectedValue) : options[0];
    const selectedLabel = selectedOption?.label;
    const selectedIcon = selectedOption?.iconSrc;

    return (
        <Wrapper>
            <TriggerWrapper
                ref={refs.setReference}
                {...getReferenceProps()}
                $disabled={disabled}
                $isBordered={isBordered}
            >
                <SelectedOption $isBordered={isBordered} $forceHeight={forceHeight}>
                    <Typography>{selectedLabel}</Typography>
                    {selectedIcon ? <img src={selectedIcon} alt={`Selected option: ${selectedLabel} icon `} /> : null}
                </SelectedOption>
                <IconWrapper>{loading ? <SpinnerIcon /> : <HiOutlineSelector />}</IconWrapper>
            </TriggerWrapper>
            <Options
                ref={refs.setFloating}
                {...getFloatingProps()}
                $isBordered={isBordered}
                style={{
                    display: isOpen ? 'flex' : 'none',
                    top: (elements.reference?.getBoundingClientRect().height || 36) + 8,
                }}
            >
                {options.map(({ label, value, iconSrc }) => {
                    const selected = value === selectedOption?.value;
                    const disableClick = loading && !selected && value !== 'Custom';
                    return (
                        <StyledOption
                            onClick={() => handleChange(value, disableClick)}
                            key={`opt-${value}-${label}`}
                            $selected={selected}
                            $loading={loading && !selected}
                        >
                            <OptionLabelWrapper>
                                {iconSrc ? <img src={iconSrc} alt={`Select option: ${value} icon `} /> : null}
                                <Typography>{label}</Typography>
                            </OptionLabelWrapper>
                            {selected ? (
                                <IconWrapper>
                                    <CheckSvg />
                                </IconWrapper>
                            ) : null}
                        </StyledOption>
                    );
                })}
            </Options>
        </Wrapper>
    );
}
