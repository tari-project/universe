import { useMemo, useRef, useState } from 'react';
import {
    autoUpdate,
    Composite,
    CompositeItem,
    FloatingFocusManager,
    FloatingList,
    offset,
    size,
    useClick,
    useDismiss,
    useFloating,
    useInteractions,
    useRole,
} from '@floating-ui/react';
import { InputWrapper, OptionListWrapper, Row, SelectTrigger } from './styles.ts';

import { ChevronSVG } from './chevron.tsx';
import Option from './Option.tsx';
import { TimePickerContext } from '@app/components/elements/inputs/time-picker/pickerContext.ts';

const fmtTimeUnit = (n: number): string => String(n).padStart(2, '0');

const hourOptions = Array.from({ length: 12 }).map((_, i) => fmtTimeUnit(i + 1));
const minuteOptions = Array.from({ length: 12 }).map((_, i) => fmtTimeUnit(i * 5));

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

    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const hoursElRef = useRef<(HTMLElement | null)[]>([]);
    const hoursLabelRef = useRef<(string | null)[]>(hourOptions);
    const minElRef = useRef<(HTMLElement | null)[]>([]);
    const minLabelRef = useRef<(string | null)[]>(minuteOptions);

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

    function handleHour(hour: string) {
        setTime((c) => ({ ...c, hour }));
    }
    function handleMinute(minute: string) {
        setTime((c) => ({ ...c, minute }));
    }
    function handleAMPM(val: string) {
        if (val === 'AM' || val === 'PM') {
            const ampm = val as 'AM' | 'PM';
            setTime((c) => ({ ...c, ampm }));
        }
    }
    const handleSelect = (type: 'h' | 'm' | 'ap', label: string) => {
        switch (type) {
            case 'h':
                handleHour(label);
                break;
            case 'm':
                handleMinute(label);
                break;
            case 'ap':
                handleAMPM(label);
                break;
        }
    };

    const pickerContext = useMemo(
        () => ({ activeIndex, selectedIndex, getItemProps, handleSelect }),
        [activeIndex, selectedIndex, getItemProps, handleSelect]
    );

    return (
        <InputWrapper>
            <SelectTrigger tabIndex={0} ref={refs.setReference} {...getReferenceProps()}>
                {`${time.hour}:${time.minute} ${time.ampm}`} <ChevronSVG />
            </SelectTrigger>
            {isOpen && (
                <TimePickerContext.Provider value={pickerContext}>
                    <FloatingFocusManager context={context} initialFocus={-1}>
                        <Composite cols={2}>
                            <Row ref={refs.setFloating} style={floatingStyles} {...getFloatingProps()}>
                                <CompositeItem
                                    render={() => (
                                        <OptionListWrapper>
                                            <FloatingList elementsRef={hoursElRef} labelsRef={hoursLabelRef}>
                                                {hourOptions.map((value, i) => {
                                                    return (
                                                        <Option
                                                            key={`hours_${value}`}
                                                            label={value}
                                                            type="h"
                                                            {...getItemProps()}
                                                        />
                                                    );
                                                })}
                                            </FloatingList>
                                        </OptionListWrapper>
                                    )}
                                />

                                <CompositeItem
                                    render={() => (
                                        <OptionListWrapper>
                                            <FloatingList elementsRef={minElRef} labelsRef={minLabelRef}>
                                                {minuteOptions.map((value, i) => {
                                                    return (
                                                        <Option
                                                            key={`hours_${value}`}
                                                            label={value}
                                                            type="m"
                                                            {...getItemProps()}
                                                        />
                                                    );
                                                })}
                                            </FloatingList>
                                        </OptionListWrapper>
                                    )}
                                />
                            </Row>
                        </Composite>
                    </FloatingFocusManager>
                </TimePickerContext.Provider>
            )}
        </InputWrapper>
    );
};
