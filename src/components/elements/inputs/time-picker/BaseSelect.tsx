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
import {
    IconWrapper,
    InputWrapper,
    OptionListWrapper,
    Row,
    SelectTrigger,
    SelectWrapper,
    StyledOption,
    TriggerContent,
} from './styles.ts';

import { ChevronSVG } from './chevron.tsx';

import { useConfigMiningStore } from '@app/store';
import { getModeColours } from '@app/components/mode/helpers.ts';
import { TIME_PERIOD, TimeParts } from '@app/types/mining/schedule.ts';

const fmtTimeUnit = (n: number): string => String(n).padStart(2, '0');

const hourOptions = Array.from({ length: 12 }).map((_, i) => i + 1);
const minuteOptions = Array.from({ length: 12 }).map((_, i) => i * 5);

const defaultTime: TimeParts = {
    hour: hourOptions[0],
    minute: minuteOptions[0],
    timePeriod: 'AM',
};

interface BaseSelectProps {
    initialTime?: TimeParts;
    onChange?: (time: TimeParts) => void;
}

export const BaseSelect = ({ initialTime, onChange }: BaseSelectProps) => {
    const selectedMiningMode = useConfigMiningStore((s) => s.getSelectedMiningMode());
    const modeColour = getModeColours(selectedMiningMode?.mode_type);
    const _initialTime = initialTime || defaultTime;
    const [isOpen, setIsOpen] = useState(false);
    const [time, setTime] = useState<TimeParts>(_initialTime);
    const [hour, setHour] = useState<TimeParts['hour']>(_initialTime.hour);
    const [minute, setMinute] = useState<TimeParts['minute']>(_initialTime.minute);
    const [AMPM, setAMPM] = useState<TimeParts['timePeriod']>(_initialTime.timePeriod);

    const [activeIndex, setActiveIndex] = useState(0);

    const { refs, floatingStyles, context } = useFloating<HTMLElement>({
        placement: 'bottom-end',
        open: isOpen,
        onOpenChange: setIsOpen,
        whileElementsMounted: autoUpdate,
        middleware: [
            offset({ mainAxis: 20 }),
            size({
                apply({ elements, availableHeight }) {
                    const refWidth = elements.reference.getBoundingClientRect().width;
                    Object.assign(elements.floating.style, {
                        maxHeight: `${availableHeight}px`,
                        maxWidth: `${refWidth}px`,
                    });
                },
                padding: {
                    bottom: 10,
                },
            }),
        ],
    });

    const click = useClick(context);
    const dismiss = useDismiss(context);
    const role = useRole(context, { role: 'grid' });

    const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([dismiss, click, role]);

    const handleSelect = (type: 'h' | 'm' | 'ap', label: number | string) => {
        switch (type) {
            case 'h':
                setHour(Number(label));
                break;
            case 'm':
                setMinute(Number(label));
                break;
            case 'ap':
                setAMPM(label as 'AM' | 'PM');
                break;
        }
    };

    useEffect(() => {
        setTime({ hour, minute, timePeriod: AMPM });
    }, [hour, minute, AMPM]);

    useEffect(() => {
        onChange?.(time);
    }, [time]);

    return (
        <InputWrapper>
            <SelectTrigger tabIndex={0} ref={refs.setReference} {...getReferenceProps()}>
                <TriggerContent>
                    {`${fmtTimeUnit(time.hour)}:${fmtTimeUnit(time.minute)} ${time.timePeriod}`}
                    <IconWrapper $isOpen={isOpen}>
                        <ChevronSVG />
                    </IconWrapper>
                </TriggerContent>
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
                                                    $borderColour={modeColour.light}
                                                    $activeColour={modeColour.shadow}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleSelect('h', value);
                                                        }
                                                    }}
                                                    onClick={() => handleSelect('h', value)}
                                                >
                                                    {fmtTimeUnit(value)}
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
                                                    $borderColour={modeColour.light}
                                                    $activeColour={modeColour.shadow}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleSelect('m', value);
                                                        }
                                                    }}
                                                    onClick={() => handleSelect('m', value)}
                                                >
                                                    {fmtTimeUnit(value)}
                                                </StyledOption>
                                            )}
                                        />
                                    );
                                })}
                            </OptionListWrapper>
                            <OptionListWrapper>
                                {TIME_PERIOD.map((value, _i) => {
                                    const i = _i + 24;
                                    const selected = AMPM === TIME_PERIOD[_i];
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
                                                    $borderColour={modeColour.light}
                                                    $activeColour={modeColour.shadow}
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
