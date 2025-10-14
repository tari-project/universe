import { useRef, useState } from 'react';
import {
    autoUpdate,
    FloatingFocusManager,
    offset,
    size,
    useClick,
    useDismiss,
    useFloating,
    useInteractions,
    useListNavigation,
    useRole,
    useTypeahead,
} from '@floating-ui/react';
import { Option, SelectList, SelectTrigger } from './styles.ts';

interface BaseSelectProps {
    options: string[];
}

export const BaseSelect = ({ options }: BaseSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const { refs, floatingStyles, context } = useFloating<HTMLElement>({
        placement: 'bottom-start',
        open: isOpen,
        onOpenChange: setIsOpen,
        whileElementsMounted: autoUpdate,
        middleware: [
            offset(0),
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

    const listRef = useRef<(HTMLElement | null)[]>([]);
    const listContentRef = useRef(options);
    const isTypingRef = useRef(false);
    const click = useClick(context, { event: 'mousedown' });
    const dismiss = useDismiss(context);
    const role = useRole(context, { role: 'listbox' });
    const listNav = useListNavigation(context, {
        listRef,
        activeIndex,
        selectedIndex,
        onNavigate: setActiveIndex,
        loop: true,
    });
    const typeahead = useTypeahead(context, {
        listRef: listContentRef,
        activeIndex,
        selectedIndex,
        onMatch: isOpen ? setActiveIndex : setSelectedIndex,
        onTypingChange(isTyping) {
            isTypingRef.current = isTyping;
        },
    });

    const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
        dismiss,
        role,
        listNav,
        typeahead,
        click,
    ]);

    const handleSelect = (index: number) => {
        setSelectedIndex(index);
        setIsOpen(false);
    };

    const selectedItemLabel = selectedIndex !== null ? options[selectedIndex] : undefined;

    return (
        <>
            <SelectTrigger tabIndex={0} ref={refs.setReference} aria-autocomplete="none" {...getReferenceProps()}>
                {selectedItemLabel || '11'}
            </SelectTrigger>
            {isOpen && (
                <FloatingFocusManager context={context} modal={false}>
                    <SelectList ref={refs.setFloating} style={floatingStyles} {...getFloatingProps()}>
                        {options.map((value, i) => (
                            <Option
                                key={value}
                                ref={(node) => {
                                    listRef.current[i] = node;
                                }}
                                role="option"
                                tabIndex={i === activeIndex ? 0 : -1}
                                aria-selected={i === selectedIndex && i === activeIndex}
                                $active={i === activeIndex}
                                $selected={i === selectedIndex}
                                {...getItemProps({
                                    onClick() {
                                        handleSelect(i);
                                    },
                                    onKeyDown(e) {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleSelect(i);
                                        }
                                        if (e.key === ' ' && !isTypingRef.current) {
                                            e.preventDefault();
                                            handleSelect(i);
                                        }
                                    },
                                })}
                            >
                                {value}
                            </Option>
                        ))}
                    </SelectList>
                </FloatingFocusManager>
            )}
        </>
    );
};
