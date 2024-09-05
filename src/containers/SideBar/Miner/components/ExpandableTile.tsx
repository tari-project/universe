import { StatWrapper, TileTop } from '../styles';
import { Typography } from '@app/components/elements/Typography.tsx';
import { ReactNode, useState } from 'react';
import QuestionMarkSvg from '@app/components/svgs/QuestionMarkSvg.tsx';
import { ExpandableTileItem, ExpandedWrapper, TriggerWrapper } from './ExpandableTile.styles.ts';
import { StyledIcon } from '@app/containers/Dashboard/MiningView/components/MiningButton.styles.ts';
import { AnimatePresence } from 'framer-motion';

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

    return (
        <ExpandableTileItem
            animate={{ height: expanded ? 'auto' : '65px' }}
            transition={{ duration: 0.2, ease: 'linear' }}
        >
            <TileTop>
                <Typography style={{ color: expanded ? '#000' : 'inherit' }}>{title}</Typography>
                <TriggerWrapper onClick={() => setExpanded((c) => !c)}>
                    <QuestionMarkSvg />
                </TriggerWrapper>
            </TileTop>
            <AnimatePresence>
                {expanded && (
                    <ExpandedWrapper variants={variants} initial="hidden" animate="visible" exit="hidden">
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
        </ExpandableTileItem>
    );
}
