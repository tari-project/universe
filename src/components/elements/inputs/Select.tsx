import { HiOutlineSelector } from 'react-icons/hi';
import { useState } from 'react';
import { Typography } from '@app/components/elements/Typography.tsx';
import { SpinnerIcon } from '@app/components/elements/SpinnerIcon.tsx';
import CheckSvg from '@app/components/svgs/CheckSvg.tsx';

import {
    IconWrapper,
    OptionLabelWrapper,
    Options,
    SelectedOption,
    StyledOption,
    TriggerWrapper,
} from './Select.styles.ts';
import { useClick, useDismiss, useFloating, useInteractions, useRole } from '@floating-ui/react';
import { LayoutGroup } from 'framer-motion';

interface Option {
    label: string;
    selectedLabel?: string;
    iconSrc?: string;
    value: string;
}

interface Props {
    options: Option[];
    onChange: (value: Option['value']) => void;
    disabled?: boolean;
    loading?: boolean;
    selectedValue?: Option['value'];
}

export function Select({ options, selectedValue, disabled, loading, onChange }: Props) {
    const [isOpen, setIsOpen] = useState(false);

    const { refs, context } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
    });

    function handleChange(value: string) {
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
        <LayoutGroup id="dropdown-select">
            <TriggerWrapper layout $disabled={disabled} ref={refs.setReference} {...getReferenceProps()}>
                <SelectedOption layout>
                    <Typography>{selectedLabel}</Typography>
                    {selectedIcon ? <img src={selectedIcon} alt={`Selected option: ${selectedLabel} icon `} /> : null}
                </SelectedOption>
                <IconWrapper>{loading ? <SpinnerIcon /> : <HiOutlineSelector />}</IconWrapper>
            </TriggerWrapper>
            {isOpen ? (
                <Options layout ref={refs.setFloating} {...getFloatingProps()}>
                    <LayoutGroup id="options">
                        {options.map(({ label, value, iconSrc }) => {
                            const selected = value === selectedOption?.value;
                            return (
                                <StyledOption
                                    layout
                                    onClick={() => handleChange(value)}
                                    key={`opt-${value}-${label}`}
                                    $selected={selected}
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
                    </LayoutGroup>
                </Options>
            ) : null}
        </LayoutGroup>
    );
}
