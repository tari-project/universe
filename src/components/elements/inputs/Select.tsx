import { HiOutlineSelector } from 'react-icons/hi';
import { useEffect, useState, useRef } from 'react';
import { Typography } from '@app/components/elements/Typography.tsx';

import CheckSvg from '@app/components/svgs/CheckSvg.tsx';

import {
    IconWrapper,
    OptionLabelWrapper,
    Options,
    OptionsPosition,
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
    useListNavigation,
    useTypeahead,
    FloatingFocusManager,
    UseFloatingOptions,
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
    customIcon?: React.ReactNode | ((open: boolean) => React.ReactNode);
    triggerTypographyProps?: Omit<React.ComponentProps<typeof Typography>, 'children'>;
    floatingProps?: UseFloatingOptions;
    optionItemTypographyProps?: Omit<React.ComponentProps<typeof Typography>, 'children'>;
    isSync?: boolean;
}

export function Select({
    options,
    selectedValue,
    disabled,
    loading,
    onChange,
    variant = 'primary',
    forceHeight,
    customIcon,
    triggerTypographyProps = {},
    optionItemTypographyProps = {},
    floatingProps = {},
    isSync,
}: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const listRef = useRef<(HTMLElement | null)[]>([]);
    const isBordered = variant === 'bordered';
    const isMinimal = variant === 'minimal';

    const { update, refs, elements, context, floatingStyles } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
        placement: 'bottom-start',
        middleware: [offset({ mainAxis: 5 }), flip()],
        ...floatingProps,
    });

    useEffect(() => {
        if (isOpen && elements.reference && elements.floating) {
            return autoUpdate(elements.reference, elements.floating, update, {
                layoutShift: false,
                ancestorResize: false,
            });
        }
    }, [isOpen, elements, update]);

    useEffect(() => {
        if (isOpen) {
            const selectedIndex = options.findIndex((option) => option.value === selectedValue);
            const initialIndex = selectedIndex >= 0 ? selectedIndex : 0;
            setActiveIndex(initialIndex);
        } else {
            setActiveIndex(null);
        }
    }, [isOpen, selectedValue, options]);

    function handleChange(value: string, disableClick = false) {
        if (disableClick) return;
        onChange(value);
        setIsOpen(false);
    }

    const click = useClick(context);
    const dismiss = useDismiss(context);
    const role = useRole(context, { role: 'listbox' });

    const listNavigation = useListNavigation(context, {
        listRef,
        activeIndex,
        onNavigate: setActiveIndex,
        loop: true,
    });

    const typeahead = useTypeahead(context, {
        listRef: {
            current: options.map((option) => option.label),
        },
        activeIndex,
        onMatch: setActiveIndex,
        onTypingChange(isTyping) {
            if (isTyping) {
                setActiveIndex(null);
            }
        },
        resetMs: 1000,
    });

    const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
        click,
        dismiss,
        role,
        listNavigation,
        typeahead,
    ]);

    const selectedOption = selectedValue ? options.find((o) => o.value === selectedValue) : options[0];
    const selectedLabel = selectedOption?.label;
    const selectedIcon = selectedOption?.iconSrc;

    const triggerOption = isMinimal ? (
        <>
            {selectedIcon ? <img src={selectedIcon} alt={`Selected option: ${selectedLabel} icon `} /> : null}
            <Typography {...triggerTypographyProps}>{selectedLabel}</Typography>
        </>
    ) : (
        <>
            <SelectedOption $isBordered={isBordered} $forceHeight={forceHeight}>
                <Typography {...triggerTypographyProps}>{selectedLabel}</Typography>
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
                $isSync={isSync}
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                tabIndex={disabled ? -1 : 0}
            >
                {triggerOption}
                {customIcon ? (
                    typeof customIcon === 'function' ? (
                        customIcon(isOpen)
                    ) : (
                        customIcon
                    )
                ) : (
                    <IconWrapper>{loading ? <LoadingDots /> : <HiOutlineSelector />}</IconWrapper>
                )}
            </TriggerWrapper>
            {isOpen && (
                <FloatingFocusManager context={context} modal={true} initialFocus={activeIndex || 0}>
                    <OptionsPosition ref={refs.setFloating} {...getFloatingProps()} style={floatingStyles}>
                        <Options $isBordered={isBordered} role="listbox">
                            {options.map(({ label, value, iconSrc }, index) => {
                                const selected = value === selectedOption?.value;
                                const disableClick = loading && !selected && value !== 'Custom';
                                const isActive = activeIndex === index;
                                return (
                                    <StyledOption
                                        ref={(node) => {
                                            listRef.current[index] = node;
                                        }}
                                        onClick={() => handleChange(value, disableClick)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleChange(value, disableClick);
                                            }
                                        }}
                                        key={`opt-${value}-${label}`}
                                        $selected={selected}
                                        $loading={loading && !selected}
                                        $isBordered={isBordered}
                                        $isActive={isActive}
                                        role="option"
                                        aria-selected={selected}
                                        tabIndex={isActive ? 0 : -1}
                                        {...getItemProps({
                                            onClick() {
                                                handleChange(value, disableClick);
                                            },
                                        })}
                                    >
                                        <OptionLabelWrapper>
                                            {iconSrc ? (
                                                <img src={iconSrc} alt={`Select option: ${value} icon `} />
                                            ) : null}
                                            <Typography {...optionItemTypographyProps}>{label}</Typography>
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
                    </OptionsPosition>
                </FloatingFocusManager>
            )}
        </Wrapper>
    );
}
