import { useRef, useState } from 'react';
import {
    useClick,
    useDismiss,
    UseFloatingReturn,
    useInteractions,
    useListNavigation,
    useRole,
} from '@floating-ui/react';
import { Option, OptionListWrapper } from './styles.ts';

interface OptionListProps {
    options: string[];
    context: UseFloatingReturn['context'];
    onSelected: (value: string | 'AM' | 'PM') => void;
    tabIndex: number;
    initialIndex: number | null;
}
export const OptionList = ({ options, context, onSelected, tabIndex, initialIndex }: OptionListProps) => {
    const [activeIndex, setActiveIndex] = useState<number | null>(initialIndex);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(initialIndex);

    const listRef = useRef<(HTMLElement | null)[]>([]);

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

    const { getItemProps } = useInteractions([dismiss, role, listNav, click]);

    const handleSelect = (index: number) => {
        onSelected(options[index]);
        setSelectedIndex(index);
    };

    return (
        <OptionListWrapper>
            {options.map((value, i) => (
                <Option
                    key={value}
                    ref={(node) => {
                        listRef.current[i] = node;
                    }}
                    role="option"
                    tabIndex={i === activeIndex ? tabIndex : -1}
                    aria-selected={i === selectedIndex}
                    $selected={i === selectedIndex}
                    $active={i === activeIndex}
                    {...getItemProps({
                        onClick() {
                            handleSelect(i);
                        },
                        onKeyDown(e) {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSelect(i);
                            }
                            if (e.key === ' ') {
                                e.preventDefault();
                                handleSelect(i);
                            }
                        },
                    })}
                >
                    {value}
                </Option>
            ))}
        </OptionListWrapper>
    );
};
