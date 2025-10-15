import { useContext } from 'react';
import { useListItem } from '@floating-ui/react';
import { TimePickerContext } from './pickerContext.ts';
import { StyledOption } from './styles.ts';

export default function Option({ label, type }: { label: string; type: 'h' | 'm' | 'ap' }) {
    const { activeIndex, selectedIndex, handleSelect } = useContext(TimePickerContext);
    const { ref, index } = useListItem({ label });

    const isActive = activeIndex === index;
    const isSelected = selectedIndex === index;

    return (
        <StyledOption
            ref={ref}
            role="option"
            tabIndex={isActive ? 0 : -1}
            aria-selected={isSelected}
            $selected={isSelected}
            $active={isActive}
            onClick={() => handleSelect(type, label)}
        >
            {label}
        </StyledOption>
    );
}
