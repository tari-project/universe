import { ReactNode, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import {
    CollapsibleWrapper,
    CategoryHeader,
    CategoryToggle,
    CollapsibleContent,
    CollapsibleContentPadding,
} from './styles';

interface CollapsibleGroupProps {
    title: string;
    children: ReactNode;
    defaultOpen?: boolean;
}

export function CollapsibleGroup({ title, children, defaultOpen = false }: CollapsibleGroupProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <CollapsibleWrapper>
            <CategoryHeader onClick={() => setIsOpen(!isOpen)}>
                {title}
                <CategoryToggle $isOpen={isOpen}>{isOpen ? '−' : '+'}</CategoryToggle>
            </CategoryHeader>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <CollapsibleContent
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                    >
                        <CollapsibleContentPadding>{children}</CollapsibleContentPadding>
                    </CollapsibleContent>
                )}
            </AnimatePresence>
        </CollapsibleWrapper>
    );
}
