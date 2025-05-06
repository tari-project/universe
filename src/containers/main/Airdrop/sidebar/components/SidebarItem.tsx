import { ReactNode, useState } from 'react';
import { offset, safePolygon, useFloating, useHover, useInteractions } from '@floating-ui/react';
import { ActionHoveredWrapper, ActionText, ActionWrapper, ContentWrapper } from './item.style.ts';
import { AnimatePresence } from 'motion/react';

interface ActionProps {
    children: ReactNode;
    hoverContent?: ReactNode;
    tooltipContent?: ReactNode;
    text?: string;
}

export function SidebarItem({ children, text, hoverContent, tooltipContent }: ActionProps) {
    const [hovered, setHovered] = useState(false);

    const { x, refs, context, floatingStyles } = useFloating({
        open: hovered,
        onOpenChange: setHovered,
        placement: 'right',
        middleware: [offset({ mainAxis: 15 })],
    });

    const hover = useHover(context, {
        move: !hovered,
        handleClose: safePolygon(),
    });

    const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

    return (
        <ActionWrapper ref={refs.setReference} {...getReferenceProps()}>
            <ContentWrapper>{hovered && hoverContent ? hoverContent : children}</ContentWrapper>
            {text ? <ActionText>{text}</ActionText> : null}
            <AnimatePresence>
                {tooltipContent && hovered && (
                    <ActionHoveredWrapper
                        ref={refs.setFloating}
                        {...getFloatingProps()}
                        style={floatingStyles}
                        initial={{ opacity: 0, x: x - 10 }}
                        exit={{ opacity: 0, x: x - 5 }}
                        animate={{ opacity: 1, x }}
                    >
                        {tooltipContent}
                    </ActionHoveredWrapper>
                )}
            </AnimatePresence>
        </ActionWrapper>
    );
}
