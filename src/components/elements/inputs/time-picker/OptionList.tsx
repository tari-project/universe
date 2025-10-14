import { useEffect, useRef, useState } from 'react';
import { useClick, UseFloatingReturn, useInteractions, useListNavigation } from '@floating-ui/react';
import { Option, OptionListWrapper } from './styles.ts';

interface OptionListProps {
    id: string;
    options: string[];
    context: UseFloatingReturn['context'];
    onSelected: (value: string | 'AM' | 'PM') => void;
    initialIndex: number;
}
export const OptionList = ({ id, options, context, onSelected, initialIndex }: OptionListProps) => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const listRef = useRef<(HTMLElement | null)[]>([]);
    const click = useClick(context);
    const listNav = useListNavigation(context, {
        listRef,
        activeIndex,
        selectedIndex,
        onNavigate: (i) => {
            setActiveIndex(i);
        },
        loop: true,
        focusItemOnOpen: true,
        nested: true,
    });

    const { getItemProps } = useInteractions([listNav, click]);

    const handleSelect = (index: number) => {
        setSelectedIndex(index);
        onSelected(options[index]);
    };

    useEffect(() => {
        setSelectedIndex(initialIndex);
    }, [initialIndex]);

    return (
        <OptionListWrapper id={id}>
            {options.map((value, i) => {
                const isActive = i === activeIndex;
                const isSelected = i === selectedIndex;
                return (
                    <Option
                        key={`${id}_${value}`}
                        ref={(node) => {
                            listRef.current[i] = node;
                        }}
                        role="option"
                        tabIndex={isActive ? 0 : -1}
                        // aria-selected={isSelected}
                        $selected={isSelected}
                        $active={isActive}
                        onClick={() => handleSelect(i)}
                        {...getItemProps({
                            onClick() {
                                handleSelect(i);
                            },
                            active: isActive,
                            selected: isSelected,
                        })}
                    >
                        {value}
                    </Option>
                );
            })}
        </OptionListWrapper>
    );
};
