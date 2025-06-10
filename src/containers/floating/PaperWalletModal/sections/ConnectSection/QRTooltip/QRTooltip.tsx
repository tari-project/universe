import { AnimatePresence } from 'motion/react';
import { Image, Menu, Text, Trigger, Wrapper } from './styles';
import { useState, type JSX } from 'react';
import { autoUpdate, flip, offset, safePolygon, useFloating, useHover, useInteractions } from '@floating-ui/react';

interface Props {
    trigger: JSX.Element;
    text: string | JSX.Element;
    codeImage: string;
}

export default function QRTooltip({ trigger, text, codeImage }: Props) {
    const [expanded, setExpanded] = useState(false);

    const { refs, context, floatingStyles } = useFloating({
        open: expanded,
        onOpenChange: setExpanded,
        placement: 'bottom',
        middleware: [
            offset(7),
            flip({
                fallbackPlacements: ['top', 'bottom'],
            }),
        ],

        whileElementsMounted(referenceEl, floatingEl, update) {
            return autoUpdate(referenceEl, floatingEl, update, {
                layoutShift: false,
            });
        },
    });

    const hover = useHover(context, {
        move: !expanded,
        handleClose: safePolygon(),
    });

    const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

    return (
        <Wrapper>
            <Trigger ref={refs.setReference} {...getReferenceProps()}>
                {trigger}
            </Trigger>

            <AnimatePresence mode="sync">
                {expanded && (
                    <Menu
                        ref={refs.setFloating}
                        {...getFloatingProps()}
                        style={floatingStyles}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <Image src={codeImage} alt="" />
                        <Text>{text}</Text>
                    </Menu>
                )}
            </AnimatePresence>
        </Wrapper>
    );
}
