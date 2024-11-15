import { AnimatePresence } from 'framer-motion';
import { Image, Menu, Text, Trigger, Wrapper } from './styles';
import { useState } from 'react';
import { autoUpdate, safePolygon, useFloating, useHover, useInteractions } from '@floating-ui/react';

interface Props {
    trigger: JSX.Element;
    text: string | JSX.Element;
    codeImage: string;
}

export default function QRTooltip({ trigger, text, codeImage }: Props) {
    const [expanded, setExpanded] = useState(false);

    const { refs, context } = useFloating({
        open: expanded,
        onOpenChange: setExpanded,

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
