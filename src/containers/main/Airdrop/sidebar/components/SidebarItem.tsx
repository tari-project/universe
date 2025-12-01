import { ReactNode, useState } from 'react';
import { offset, safePolygon, useFloating, useHover, useFocus, useInteractions } from '@floating-ui/react';
import { ActionHoveredWrapper, ActionText, ActionWrapper, ContentWrapper, TooltipBox } from './item.style.ts';
import { AnimatePresence } from 'motion/react';

interface ActionProps {
    children: ReactNode;
    hoverContent?: ReactNode;
    tooltipContent?: ReactNode;
    text?: string;
    isWrapped?: boolean;
    onClick?: () => void;
}

export function SidebarItem({ children, text, hoverContent, tooltipContent, onClick, isWrapped = false }: ActionProps) {
    const [hovered, setHovered] = useState(false);

    const { refs, context, floatingStyles } = useFloating({
        open: hovered,
        onOpenChange: setHovered,
        placement: 'right',
        middleware: [offset(15)],
    });

    const hover = useHover(context, {
        move: !hovered,
        handleClose: safePolygon(),
    });

    const focus = useFocus(context);

    const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus]);

    return (
        <ActionWrapper
            ref={refs.setReference}
            {...getReferenceProps()}
            tabIndex={0}
            onClick={onClick}
            style={{ cursor: onClick || isWrapped ? 'pointer' : 'default' }}
        >
            <ContentWrapper>{hovered && hoverContent ? hoverContent : children}</ContentWrapper>
            {text ? <ActionText>{text}</ActionText> : null}
            <AnimatePresence>
                {tooltipContent && hovered && (
                    <ActionHoveredWrapper ref={refs.setFloating} {...getFloatingProps()} style={floatingStyles}>
                        <TooltipBox
                            initial={{ opacity: 0, x: 10 }}
                            exit={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            {tooltipContent}
                        </TooltipBox>
                    </ActionHoveredWrapper>
                )}
            </AnimatePresence>
        </ActionWrapper>
    );
}
