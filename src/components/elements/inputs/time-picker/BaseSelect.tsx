import { useEffect, useState } from 'react';
import {
    autoUpdate,
    Composite,
    CompositeItem,
    FloatingFocusManager,
    offset,
    size,
    useClick,
    useDismiss,
    useFloating,
    useInteractions,
    useRole,
} from '@floating-ui/react';
import { InputWrapper, OptionListWrapper, Row, SelectTrigger, SelectWrapper, StyledOption } from './styles.ts';

import { ChevronSVG } from './chevron.tsx';

const fmtTimeUnit = (n: number): string => String(n).padStart(2, '0');

const hourOptions = Array.from({ length: 12 }).map((_, i) => fmtTimeUnit(i + 1));
const minuteOptions = Array.from({ length: 12 }).map((_, i) => fmtTimeUnit(i * 5));
const ampm = ['AM', 'PM'];

interface TimeParts {
    hour: string;
    minute: string;
    ampm: 'AM' | 'PM';
}
const initialTime: TimeParts = {
    hour: hourOptions[0],
    minute: minuteOptions[0],
    ampm: 'AM',
};

export const BaseSelect = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [time, setTime] = useState<TimeParts>(initialTime);
    const [hour, setHour] = useState<TimeParts['hour']>(initialTime.hour);
    const [minute, setMinute] = useState<TimeParts['minute']>(initialTime.minute);
    const [AMPM, setAMPM] = useState<TimeParts['ampm']>(initialTime.ampm);

    const [activeIndex, setActiveIndex] = useState(0);

    const { refs, floatingStyles, context } = useFloating<HTMLElement>({
        placement: 'bottom',
        open: isOpen,
        onOpenChange: setIsOpen,
        whileElementsMounted: autoUpdate,
        middleware: [
            offset({ mainAxis: 5 }),
            size({
                apply({ elements, availableHeight }) {
                    const refWidth = elements.reference.getBoundingClientRect().width;
                    Object.assign(elements.floating.style, {
                        maxHeight: `${availableHeight}px`,
                        maxWidth: `${refWidth + 30}px`,
                    });
                },
                padding: {
                    bottom: 20,
                },
            }),
        ],
    });

    const click = useClick(context);
    const dismiss = useDismiss(context);
    const role = useRole(context, { role: 'grid' });

    const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([dismiss, click, role]);

    const handleSelect = (type: 'h' | 'm' | 'ap', label: string) => {
        switch (type) {
            case 'h':
                setHour(label);
                break;
            case 'm':
                setMinute(label);
                break;
            case 'ap':
                setAMPM(label as 'AM' | 'PM');
                break;
        }
    };

    useEffect(() => {
        setTime({ hour, minute, ampm: AMPM });
    }, [hour, minute, AMPM]);

    return (
        <InputWrapper>
            <SelectTrigger tabIndex={0} ref={refs.setReference} {...getReferenceProps()}>
                {`${time.hour}:${time.minute} ${time.ampm}`} <ChevronSVG />
            </SelectTrigger>
            {isOpen && (
                <FloatingFocusManager context={context}>
                    <SelectWrapper ref={refs.setFloating} style={floatingStyles} {...getFloatingProps()}>
                        <Composite
                            dense
                            onNavigate={setActiveIndex}
                            activeIndex={activeIndex}
                            render={(htmlProps) => <Row {...htmlProps} role="grid" />}
                        >
                            <OptionListWrapper>
                                {hourOptions.map((value, i) => {
                                    const selected = hour === hourOptions[i];
                                    return (
                                        <CompositeItem
                                            key={`hours_${value}`}
                                            render={(htmlProps) => (
                                                <StyledOption
                                                    {...htmlProps}
                                                    {...getItemProps()}
                                                    role="option"
                                                    $selected={selected}
                                                    $active={activeIndex === i}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleSelect('h', value);
                                                        }
                                                    }}
                                                    onClick={() => handleSelect('h', value)}
                                                >
                                                    {value}
                                                </StyledOption>
                                            )}
                                        />
                                    );
                                })}
                            </OptionListWrapper>
                            <OptionListWrapper>
                                {minuteOptions.map((value, _i) => {
                                    const i = _i + 12;
                                    const selected = minute === minuteOptions[_i];
                                    return (
                                        <CompositeItem
                                            key={`min_${value}`}
                                            render={(htmlProps) => (
                                                <StyledOption
                                                    {...htmlProps}
                                                    {...getItemProps()}
                                                    role="option"
                                                    $selected={selected}
                                                    $active={activeIndex === i}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleSelect('m', value);
                                                        }
                                                    }}
                                                    onClick={() => handleSelect('m', value)}
                                                >
                                                    {value}
                                                </StyledOption>
                                            )}
                                        />
                                    );
                                })}
                            </OptionListWrapper>
                            <OptionListWrapper>
                                {ampm.map((value, _i) => {
                                    const i = _i + 24;
                                    const selected = AMPM === ampm[_i];
                                    return (
                                        <CompositeItem
                                            key={`am_${value}`}
                                            render={(htmlProps) => (
                                                <StyledOption
                                                    {...htmlProps}
                                                    {...getItemProps()}
                                                    role="option"
                                                    $selected={selected}
                                                    $active={activeIndex === i}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleSelect('ap', value);
                                                        }
                                                    }}
                                                    onClick={() => handleSelect('ap', value)}
                                                >
                                                    {value}
                                                </StyledOption>
                                            )}
                                        />
                                    );
                                })}
                            </OptionListWrapper>
                        </Composite>
                    </SelectWrapper>
                </FloatingFocusManager>
            )}
        </InputWrapper>
    );
};
