import { useState } from 'react';
import {
    autoUpdate,
    FloatingFocusManager,
    offset,
    size,
    useClick,
    useDismiss,
    useFloating,
    useInteractions,
} from '@floating-ui/react';
import { InputWrapper, Row, SelectTrigger } from './styles.ts';
import { OptionList } from '@app/components/elements/inputs/time-picker/OptionList.tsx';
import { ChevronSVG } from '@app/components/elements/inputs/time-picker/chevron.tsx';

const fmtTimeUnit = (n: number): string => String(n).padStart(2, '0');

const hourOptions = Array.from({ length: 12 }).map((_, i) => fmtTimeUnit(i + 1));
const minuteOptions = Array.from({ length: 12 }).map((_, i = 1) => fmtTimeUnit(i * 5));

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
                padding: 30,
            }),
        ],
    });

    const click = useClick(context, { event: 'mousedown' });
    const dismiss = useDismiss(context);

    const { getReferenceProps, getFloatingProps } = useInteractions([dismiss, click]);

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

    return (
        <InputWrapper>
            <SelectTrigger tabIndex={0} ref={refs.setReference} aria-autocomplete="none" {...getReferenceProps()}>
                {`${time.hour}:${time.minute} ${time.ampm}`} <ChevronSVG />
            </SelectTrigger>
            {isOpen && (
                <FloatingFocusManager context={context} initialFocus={-1}>
                    <Row ref={refs.setFloating} style={floatingStyles} {...getFloatingProps()}>
                        <OptionList
                            initialIndex={0}
                            tabIndex={0}
                            options={hourOptions}
                            context={context}
                            onSelected={handleHour}
                        />
                        <OptionList
                            initialIndex={0}
                            tabIndex={hourOptions.length}
                            options={minuteOptions}
                            context={context}
                            onSelected={handleMinute}
                        />
                        <OptionList
                            initialIndex={0}
                            tabIndex={hourOptions.length + minuteOptions.length}
                            options={['AM', 'PM']}
                            context={context}
                            onSelected={handleAMPM}
                        />
                    </Row>
                </FloatingFocusManager>
            )}
        </InputWrapper>
    );
};
