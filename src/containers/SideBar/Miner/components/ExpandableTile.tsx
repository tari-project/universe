import { StatWrapper, TileItem, TileTop } from '../styles';
import { Typography } from '@app/components/elements/Typography.tsx';
import { ReactNode, useState } from 'react';
import QuestionMarkSvg from '@app/components/svgs/QuestionMarkSvg.tsx';
import { ExpandedWrapper, TriggerWrapper } from './ExpandableTile.styles.ts';
import { StyledIcon } from '@app/containers/Dashboard/MiningView/components/MiningButton.styles.ts';
import { AnimatePresence } from 'framer-motion';
import { offset, safePolygon, useFloating, useHover, useInteractions } from '@floating-ui/react';

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
        transition: { delay: 0.1, duration: 0.3, ease: 'linear' },
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
    const { refs, floatingStyles, context } = useFloating({
        open: expanded,
        onOpenChange: setExpanded,
        placement: 'left-start',
        middleware: [offset(-22)],
    });

    const hover = useHover(context, {
        move: !expanded,
        handleClose: safePolygon(),
    });
    const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

    return (
        <TileItem>
            <TileTop>
                <Typography>{title}</Typography>
                <TriggerWrapper ref={refs.setReference} {...getReferenceProps()}>
                    <QuestionMarkSvg />
                </TriggerWrapper>
            </TileTop>
            <AnimatePresence>
                {expanded && (
                    <ExpandedWrapper
                        ref={refs.setFloating}
                        {...getFloatingProps()}
                        variants={variants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        style={floatingStyles}
                    >
                        {children}
                    </ExpandedWrapper>
                )}

                {!expanded &&
                    (isLoading ? (
                        <StyledIcon />
                    ) : (
                        <StatWrapper $useLowerCase={useLowerCase}>
                            <Typography
                                variant="h5"
                                title={stats}
                                style={{
                                    textTransform: useLowerCase ? 'lowercase' : 'inherit',
                                    lineHeight: '1.02',
                                }}
                            >
                                {stats}
                            </Typography>
                        </StatWrapper>
                    ))}
            </AnimatePresence>
        </TileItem>
    );
}
