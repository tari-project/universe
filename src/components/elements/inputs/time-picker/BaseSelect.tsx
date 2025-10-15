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
    const [isOpen, setIsOpen] = useState(true);
    const [time, setTime] = useState<TimeParts>(initialTime);
    const [hour, setHour] = useState<TimeParts['hour']>(initialTime.hour);
    const [minute, setMinute] = useState<TimeParts['minute']>(initialTime.minute);
    const [AMPM, setAMPM] = useState<TimeParts['ampm']>(initialTime.ampm);

    const [activeIndex, setActiveIndex] = useState(0);

    const { refs, floatingStyles, context } = useFloating<HTMLElement>({
        placement: 'bottom-start',
        open: isOpen,
        onOpenChange: setIsOpen,
        whileElementsMounted: autoUpdate,
        middleware: [
            offset({ mainAxis: 5, crossAxis: -10 }),
            size({
                apply({ elements, availableHeight }) {
                    Object.assign(elements.floating.style, {
                        maxHeight: `${availableHeight}px`,
                    });
                },
                padding: 10,
            }),
        ],
    });

    const click = useClick(context);
    const dismiss = useDismiss(context);
    const role = useRole(context, { role: 'listbox' });

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
                            cols={3}
                            orientation="vertical"
                            onNavigate={setActiveIndex}
                            activeIndex={activeIndex}
                            itemSizes={[
                                { width: 1, height: 12 },
                                { width: 1, height: 12 },
                                { width: 1, height: 2 },
                            ]}
                            render={<Row />}
                        >
                            <CompositeItem
                                render={(htmlProps) => (
                                    <OptionListWrapper {...htmlProps}>
                                        {hourOptions.map((value, i) => {
                                            const selected = hour === hourOptions[i];
                                            return (
                                                <StyledOption
                                                    key={`hours_${value}`}
                                                    role="option"
                                                    tabIndex={activeIndex === i ? 0 : -1}
                                                    aria-selected={selected}
                                                    $selected={selected}
                                                    $active={activeIndex === i}
                                                    {...getItemProps({
                                                        onClick: () => handleSelect('h', value),
                                                    })}
                                                >
                                                    {value}
                                                </StyledOption>
                                            );
                                        })}
                                    </OptionListWrapper>
                                )}
                            />

                            <CompositeItem
                                render={(htmlProps) => (
                                    <OptionListWrapper {...htmlProps}>
                                        {minuteOptions.map((value, _i) => {
                                            const i = _i + 12;
                                            const selected = minute === minuteOptions[_i];
                                            return (
                                                <StyledOption
                                                    key={`min_${value}`}
                                                    role="option"
                                                    tabIndex={activeIndex === i ? 0 : -1}
                                                    aria-selected={selected}
                                                    $selected={selected}
                                                    $active={activeIndex === i}
                                                    {...getItemProps({
                                                        onClick: () => handleSelect('m', value),
                                                    })}
                                                >
                                                    {value}
                                                </StyledOption>
                                            );
                                        })}
                                    </OptionListWrapper>
                                )}
                            />

                            <CompositeItem
                                render={(htmlProps) => (
                                    <OptionListWrapper {...htmlProps}>
                                        {ampm.map((value, _i) => {
                                            const i = _i + 24;
                                            const selected = AMPM === ampm[_i];
                                            return (
                                                <StyledOption
                                                    key={`am_${value}`}
                                                    role="option"
                                                    tabIndex={activeIndex === i ? 0 : -1}
                                                    aria-selected={selected}
                                                    $selected={selected}
                                                    $active={activeIndex === i}
                                                    {...getItemProps({
                                                        onClick: () => handleSelect('ap', value),
                                                    })}
                                                >
                                                    {value}
                                                </StyledOption>
                                            );
                                        })}
                                    </OptionListWrapper>
                                )}
                            />
                        </Composite>
                    </SelectWrapper>
                </FloatingFocusManager>
            )}
        </InputWrapper>
    );
};
