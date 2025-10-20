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
import { CYCLE, TimeParts } from './types.ts';
import { useConfigMiningStore } from '@app/store';
import { getModeColours } from '@app/components/mode/helpers.ts';

const fmtTimeUnit = (n: number): string => String(n).padStart(2, '0');

const hourOptions = Array.from({ length: 12 }).map((_, i) => fmtTimeUnit(i + 1));
const minuteOptions = Array.from({ length: 12 }).map((_, i) => fmtTimeUnit(i * 5));

const defaultTime: TimeParts = {
    hour: hourOptions[0],
    minute: minuteOptions[0],
    cycle: 'AM',
};

export const BaseSelect = ({ initialTime }: { initialTime?: TimeParts }) => {
    const selectedMiningMode = useConfigMiningStore((s) => s.getSelectedMiningMode());
    const modeColour = getModeColours(selectedMiningMode?.mode_type);
    const _initialTime = initialTime || defaultTime;
    const [isOpen, setIsOpen] = useState(false);
    const [time, setTime] = useState<TimeParts>(_initialTime);
    const [hour, setHour] = useState<TimeParts['hour']>(_initialTime.hour);
    const [minute, setMinute] = useState<TimeParts['minute']>(_initialTime.minute);
    const [AMPM, setAMPM] = useState<TimeParts['cycle']>(_initialTime.cycle);

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
        setTime({ hour, minute, cycle: AMPM });
    }, [hour, minute, AMPM]);

    return (
        <InputWrapper>
            <SelectTrigger tabIndex={0} ref={refs.setReference} {...getReferenceProps()}>
                <TriggerContent>
                    {`${time.hour}:${time.minute} ${time.cycle}`}
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
                                                    {value}
                                                </StyledOption>
                                            )}
                                        />
                                    );
                                })}
                            </OptionListWrapper>
                            <OptionListWrapper>
                                {CYCLE.map((value, _i) => {
                                    const i = _i + 24;
                                    const selected = AMPM === CYCLE[_i];
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
