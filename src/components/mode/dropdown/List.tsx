import { ReactNode } from 'react';
import { OptionsList } from './styles.ts';

interface ListProps {
    children: ReactNode;
}
export const List = ({ children }: ListProps) => {
    return (
        <OptionsList
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            role="listbox"
        >
            {children}
        </OptionsList>
    );
};
