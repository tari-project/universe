import { HiOutlineSelector } from 'react-icons/hi';
import { useState, MouseEvent } from 'react';
import { Typography } from '@app/components/elements/Typography.tsx';
import { SpinnerIcon } from '@app/components/elements/SpinnerIcon.tsx';
import CheckSvg from '@app/components/svgs/CheckSvg.tsx';
import { useClickOutside } from '@app/hooks/helpers/useClickOutside.ts';
import {
    Options,
    SelectedOption,
    StyledOption,
    StyledSelect,
    Wrapper,
    IconWrapper,
    OptionLabelWrapper,
} from './Select.styles.ts';

interface Option {
    label: string;
    selectedLabel?: string;
    iconSrc?: string;
    value: string;
}

interface Props {
    disabled?: boolean;
    loading?: boolean;
    options: Option[];
    selectedValue?: Option['value'];
    onChange: (value: Option['value']) => void;
}

type OnClickEvent = MouseEvent<HTMLDivElement>;

export function Select({ options, selectedValue, disabled, loading, onChange, ...props }: Props) {
    const [expanded, setExpanded] = useState(false);
    function toggleOpen() {
        setExpanded((c) => !c);
    }

    function handleChange(e: OnClickEvent, value: string) {
        e.stopPropagation();
        onChange(value);
        setExpanded(false);
    }
    const clickRef = useClickOutside(() => setExpanded(false), expanded);
    const selectedOption = selectedValue ? options.find((o) => o.value === selectedValue) : options[0];
    const selectedLabel = selectedOption?.label;
    const selectedIcon = selectedOption?.iconSrc;
    return (
        <Wrapper onClick={() => toggleOpen()} $disabled={disabled}>
            <StyledSelect {...props}>
                <SelectedOption $selected>
                    <Typography>{selectedLabel}</Typography>
                    {selectedIcon ? <img src={selectedIcon} alt={`Selected option: ${selectedLabel} icon `} /> : null}
                </SelectedOption>
                <Options ref={clickRef} id="select-options" tabIndex={0} $open={expanded}>
                    {options.map(({ label, value, iconSrc }) => {
                        const selected = value === selectedOption?.value;
                        return (
                            <StyledOption
                                onClick={(e) => handleChange(e, value)}
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
                </Options>
            </StyledSelect>
            <IconWrapper>{loading ? <SpinnerIcon /> : <HiOutlineSelector />}</IconWrapper>
        </Wrapper>
    );
}
