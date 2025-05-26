import { HiOutlineSelector } from 'react-icons/hi';
import { useEffect, useState } from 'react';
import { Typography } from '@app/components/elements/Typography.tsx';

import CheckSvg from '@app/components/svgs/CheckSvg.tsx';

import {
    IconWrapper,
    OptionLabelWrapper,
    Options,
    SelectedOption,
    SelectVariant,
    StyledOption,
    TriggerWrapper,
    Wrapper,
} from './Select.styles.ts';
import {
    autoUpdate,
    offset,
    flip,
    useClick,
    useDismiss,
    useFloating,
    useInteractions,
    useRole,
} from '@floating-ui/react';
import LoadingDots from '@app/components/elements/loaders/LoadingDots.tsx';

export interface SelectOption<T = string> {
    label: string;
    selectedLabel?: string;
    iconSrc?: string;
    value: T;
}

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
    const isMinimal = variant === 'minimal';

    const { update, refs, elements, context, floatingStyles } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
        placement: 'bottom-start',
        middleware: [offset({ mainAxis: isMinimal ? 15 : 5 }), flip()],
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

    const triggerOption = isMinimal ? (
        <>
            {selectedIcon ? <img src={selectedIcon} alt={`Selected option: ${selectedLabel} icon `} /> : null}
            <Typography>{selectedLabel}</Typography>
        </>
    ) : (
        <>
            <SelectedOption $isBordered={isBordered} $forceHeight={forceHeight}>
                <Typography>{selectedLabel}</Typography>
                {selectedIcon && variant !== 'primary' ? (
                    <img src={selectedIcon} alt={`Selected option: ${selectedLabel} icon `} />
                ) : null}
            </SelectedOption>
        </>
    );

    return (
        <Wrapper>
            <TriggerWrapper
                ref={refs.setReference}
                {...getReferenceProps()}
                $disabled={disabled}
                $isBordered={isBordered}
                $variant={variant}
            >
                {triggerOption}
                <IconWrapper>{loading ? <LoadingDots /> : <HiOutlineSelector />}</IconWrapper>
            </TriggerWrapper>
            {isOpen && (
                <Options ref={refs.setFloating} {...getFloatingProps()} $isBordered={isBordered} style={floatingStyles}>
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
            )}
        </Wrapper>
    );
}
