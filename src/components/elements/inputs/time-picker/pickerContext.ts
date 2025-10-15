import { createContext } from 'react';
import { useInteractions } from '@floating-ui/react';

interface ContextValue {
    activeIndex: number | null;
    selectedIndex: number | null;
    getItemProps: ReturnType<typeof useInteractions>['getItemProps'];
    handleSelect: (index: number | null) => void;
}

export const TimePickerContext = createContext<ContextValue>({} as ContextValue);
