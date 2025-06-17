import { AnimatePresence } from 'motion/react';
import { Menu, MenuFloating, Text, Title, Trigger, Wrapper } from './styles';
import { ReactNode, useState } from 'react';
import { autoUpdate, offset, shift, useFloating, useHover, useInteractions } from '@floating-ui/react';

interface Props {
    trigger: ReactNode;
    title: string | ReactNode;
    text: string | ReactNode;
}

export default function SyncTooltip({ trigger, title, text }: Props) {
    const [expanded, setExpanded] = useState(false);

    const { refs, context, floatingStyles } = useFloating({
        open: expanded,
        onOpenChange: setExpanded,
        placement: 'right',
        strategy: 'fixed',
        middleware: [offset(20), shift()],
        whileElementsMounted(referenceEl, floatingEl, update) {
            return autoUpdate(referenceEl, floatingEl, update, {
                layoutShift: false,
            });
        },
    });

    const hover = useHover(context, {
        move: !expanded,
    });

    const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

    return (
        <Wrapper>
            <Trigger ref={refs.setReference} {...getReferenceProps()}>
                {trigger}
            </Trigger>

            <AnimatePresence mode="sync">
                {expanded && (
                    <MenuFloating ref={refs.setFloating} {...getFloatingProps()} style={floatingStyles}>
                        <Menu
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                        >
                            <Title>{title}</Title>
                            <Text>{text}</Text>
                        </Menu>
                    </MenuFloating>
                )}
            </AnimatePresence>
        </Wrapper>
    );
}
