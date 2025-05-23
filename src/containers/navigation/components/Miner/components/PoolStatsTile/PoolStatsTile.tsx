import { useMiningMetricsStore } from '@app/store';
import { formatNumber, FormatPreset } from '@app/utils';
import {
    LeftContent,
    RightContent,
    Wrapper,
    Title,
    BalanceVal,
    Values,
    ExpandedWrapper,
    TriggerWrapper,
} from './styles';
import { Trans, useTranslation } from 'react-i18next';
import { Typography } from '@app/components/elements/Typography.tsx';
import QuestionMarkSvg from '@app/components/svgs/QuestionMarkSvg.tsx';
import { useState } from 'react';
import { offset, safePolygon, useFloating, useHover, useInteractions } from '@floating-ui/react';

import { AnimatePresence } from 'motion/react';
import { MiningTime } from '@app/components/mining/timer/MiningTime.tsx';

const variants = {
    hidden: {
        opacity: 0,
    },
    visible: {
        opacity: 1,
    },
};

export const PoolStatsTile = () => {
    const { t } = useTranslation('p2p');

    const pool_status = useMiningMetricsStore((s) => s.cpu_mining_status.pool_status);
    const loading = !!pool_status && !pool_status?.balance && !pool_status?.unpaid;
    const balanceFMT = formatNumber(pool_status?.balance || 0, FormatPreset.XTM_COMPACT);

    const [expanded, setExpanded] = useState(true);
    const { refs, context, floatingStyles } = useFloating({
        open: expanded,
        onOpenChange: setExpanded,
        placement: 'right-start',
        middleware: [offset({ mainAxis: 5 })],
    });

    const hover = useHover(context, {
        move: !expanded,
        handleClose: safePolygon(),
    });
    const { getReferenceProps, getFloatingProps } = useInteractions([hover]);
    return !pool_status ? null : (
        <Wrapper $isLoading={loading}>
            {loading ? (
                <Title style={{ textAlign: 'center' }}>{`${t('stats.tile-loading')}...`}</Title>
            ) : (
                <>
                    <LeftContent>
                        <Title>{t('stats.tile-heading')}</Title>
                        <Values>
                            <BalanceVal>{`${balanceFMT} XTM`}</BalanceVal>
                        </Values>
                    </LeftContent>
                    <RightContent>
                        <TriggerWrapper ref={refs.setReference} {...getReferenceProps()}>
                            <QuestionMarkSvg />
                        </TriggerWrapper>
                        <MiningTime variant="mini" />
                        <AnimatePresence mode="sync">
                            {expanded && (
                                <ExpandedWrapper
                                    ref={refs.setFloating}
                                    {...getFloatingProps()}
                                    style={floatingStyles}
                                    variants={variants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="hidden"
                                >
                                    <Typography variant="h5">{t('stats.tile-heading')}</Typography>
                                    <Typography variant="p">
                                        <Trans
                                            i18nKey="stats.tooltip-copy"
                                            ns="p2p"
                                            values={{ amount: `2 XTM`, duration: `~6 hrs` }}
                                            components={{ strong: <strong /> }}
                                        />
                                    </Typography>
                                </ExpandedWrapper>
                            )}
                        </AnimatePresence>
                    </RightContent>
                </>
            )}
        </Wrapper>
    );
};
