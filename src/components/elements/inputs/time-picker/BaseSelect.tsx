import { useRef, useState } from 'react';
import {
    autoUpdate,
    FloatingFocusManager,
    FloatingList,
    offset,
    size,
    useClick,
    useDismiss,
    useFloating,
    useInteractions,
    useListNavigation,
    useRole,
} from '@floating-ui/react';
import { InputWrapper, Option, OptionListWrapper, Row, SelectTrigger } from './styles.ts';

import { ChevronSVG } from '@app/components/elements/inputs/time-picker/chevron.tsx';

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

    const listRef = useRef<(HTMLElement | null)[]>([]);

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

    const listNav = useListNavigation(context, {
        listRef,
        activeIndex,
        selectedIndex,
        onNavigate: setActiveIndex,
    });

    const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([dismiss, click, role, listNav]);

    const handleSelect = (index: number) => {
        setSelectedIndex(index);
    };

    return (
        <InputWrapper>
            <SelectTrigger tabIndex={0} ref={refs.setReference} {...getReferenceProps()}>
                {`${time.hour}:${time.minute} ${time.ampm}`} <ChevronSVG />
            </SelectTrigger>
            {isOpen && (
                <FloatingFocusManager context={context} initialFocus={-1}>
                    <Row ref={refs.setFloating} style={floatingStyles} {...getFloatingProps()}>
                        <OptionListWrapper>
                            <FloatingList elementsRef={listRef}>
                                {hourOptions.map((value, i) => {
                                    const isActive = i === activeIndex;
                                    const isSelected = i === selectedIndex;
                                    return (
                                        <Option
                                            key={`hours_${value}`}
                                            ref={(node) => {
                                                listRef.current[i] = node;
                                            }}
                                            role="option"
                                            tabIndex={isActive ? 0 : -1}
                                            aria-selected={isSelected}
                                            $selected={isSelected}
                                            $active={isActive}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    handleSelect(i);
                                                }
                                            }}
                                            {...getItemProps({
                                                onClick: () => handleSelect(i),
                                            })}
                                        >
                                            {value}
                                        </Option>
                                    );
                                })}
                            </FloatingList>
                        </OptionListWrapper>
                    </Row>
                </FloatingFocusManager>
            )}
        </InputWrapper>
    );
};
