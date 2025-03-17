import { ReactNode, useState } from 'react';
import { offset, safePolygon, useFloating, useHover, useInteractions, shift } from '@floating-ui/react';
import { ActionHoveredWrapper, ActionText, ActionWrapper, ContentWrapper } from './item.style.ts';
import { AnimatePresence } from 'motion/react';

interface ActionProps {
    children: ReactNode;
    hoverContent?: ReactNode;
    tooltipContent?: ReactNode;
    text?: string;
}

export function SidebarItem({ children, text, hoverContent, tooltipContent }: ActionProps) {
    const [hovered, setHovered] = useState(true);

    const { refs, context, floatingStyles } = useFloating({
        open: hovered,
        onOpenChange: setHovered,
        strategy: 'fixed',
        placement: 'top',
        middleware: [
            offset({
                mainAxis: 10,
                crossAxis: 25,
            }),
            shift(),
        ],
    });

    const hover = useHover(context, {
        move: !hovered,
        handleClose: safePolygon(),
    });

    const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

    return (
        <ActionWrapper ref={refs.setReference} {...getReferenceProps()}>
            <ContentWrapper>{hovered && hoverContent ? hoverContent : children}</ContentWrapper>
            <ActionText>{text}</ActionText>

            <AnimatePresence>
                {tooltipContent && hovered && (
                    <ActionHoveredWrapper ref={refs.setFloating} {...getFloatingProps()} style={floatingStyles}>
                        {tooltipContent}
                    </ActionHoveredWrapper>
                )}
            </AnimatePresence>
        </ActionWrapper>
    );
}
