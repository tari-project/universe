import { StatWrapper, TileItem, TileTop } from '../styles';
import { Typography } from '@app/components/elements/Typography.tsx';
import { ReactNode, useState } from 'react';
import QuestionMarkSvg from '@app/components/svgs/QuestionMarkSvg.tsx';
import { ExpandedWrapper, TriggerWrapper } from './ExpandableTile.styles.ts';

import { AnimatePresence } from 'motion/react';
import { autoUpdate, safePolygon, useFloating, useHover, useInteractions } from '@floating-ui/react';

import { SpinnerIcon } from '@app/components/elements/loaders/SpinnerIcon.tsx';

interface ExpandableTileProps {
    title: string;
    children?: ReactNode;
    stats?: string;
    unit?: string;
    chipValue?: number;
    isLoading?: boolean;
    useLowerCase?: boolean;
}

const variants = {
    hidden: {
        opacity: 0,
        transition: { duration: 0.1, ease: 'linear' },
    },
    visible: {
        opacity: 1,
        transition: { duration: 0.2, ease: 'linear' },
    },
};

export function ExpandableTile({
    title,
    children,
    stats,
    isLoading = false,
    useLowerCase = false,
}: ExpandableTileProps) {
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
        <TileItem layoutId="expandable-tile">
            <TileTop>
                <Typography>{title}</Typography>
                <TriggerWrapper ref={refs.setReference} {...getReferenceProps()} layout>
                    <QuestionMarkSvg />
                </TriggerWrapper>
            </TileTop>
            <AnimatePresence mode="sync">
                {expanded && (
                    <ExpandedWrapper
                        layout
                        ref={refs.setFloating}
                        {...getFloatingProps()}
                        variants={variants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                    >
                        {children}
                    </ExpandedWrapper>
                )}

                {!expanded &&
                    (isLoading ? <SpinnerIcon /> : <StatWrapper $useLowerCase={useLowerCase}>{stats}</StatWrapper>)}
            </AnimatePresence>
        </TileItem>
    );
}
