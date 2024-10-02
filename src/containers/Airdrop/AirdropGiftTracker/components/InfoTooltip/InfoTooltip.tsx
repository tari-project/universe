import { AnimatePresence } from 'framer-motion';
import { Menu, Text, Title, Trigger } from './styles';
import { useState } from 'react';
import { autoUpdate, safePolygon, useFloating, useHover, useInteractions } from '@floating-ui/react';
import QuestionMarkSvg from '@app/components/svgs/QuestionMarkSvg';

interface Props {
    title?: string;
    text?: string | JSX.Element;
}

export default function InfoTooltip({ title, text }: Props) {
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
        <>
            <Trigger ref={refs.setReference} {...getReferenceProps()} layout>
                <QuestionMarkSvg />
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
                        <Title>{title}</Title>
                        <Text>{text}</Text>
                    </Menu>
                )}
            </AnimatePresence>
        </>
    );
}
