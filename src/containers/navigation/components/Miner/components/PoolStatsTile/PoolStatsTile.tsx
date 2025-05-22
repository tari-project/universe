import { useMiningMetricsStore, useMiningStore } from '@app/store';
import { formatNumber, FormatPreset } from '@app/utils';
import {
    LeftContent,
    RightContent,
    Wrapper,
    Title,
    BalanceVal,
    Values,
    MinPayoutVal,
    Timer,
    TimerDot,
    ExpandedWrapper,
    TriggerWrapper,
} from './styles';
import { Trans, useTranslation } from 'react-i18next';
import { Typography } from '@app/components/elements/Typography.tsx';
import QuestionMarkSvg from '@app/components/svgs/QuestionMarkSvg.tsx';
import { useState } from 'react';
import { offset, safePolygon, useFloating, useHover, useInteractions } from '@floating-ui/react';

import { AnimatePresence } from 'motion/react';

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
    const miningTime = useMiningStore((s) => s.miningTime);
    const pool_status = useMiningMetricsStore((s) => s.cpu_mining_status.pool_status);
    const loading = !pool_status?.balance && !pool_status?.unpaid && !!pool_status;
    const balanceFMT = formatNumber(pool_status?.balance || 0, FormatPreset.XTM_COMPACT);
    const unpaidFMT = formatNumber(pool_status?.unpaid || 0, FormatPreset.XTM_COMPACT);

    const [expanded, setExpanded] = useState(false);
    const { refs, context, floatingStyles } = useFloating({
        open: expanded,
        onOpenChange: setExpanded,
        placement: 'right-start',
        middleware: [offset(10)],
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
                            <MinPayoutVal>{`/${unpaidFMT} XTM`}</MinPayoutVal>
                        </Values>
                    </LeftContent>
                    <RightContent>
                        <TriggerWrapper ref={refs.setReference} {...getReferenceProps()}>
                            <QuestionMarkSvg />
                        </TriggerWrapper>
                        {miningTime ? (
                            <Timer>
                                <TimerDot />
                                <Typography>{miningTime}</Typography>
                            </Timer>
                        ) : (
                            <div />
                        )}
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
                                    <Typography variant="h6">{t('stats.tile-heading')}</Typography>
                                    <Typography variant="p">
                                        <Trans
                                            i18nKey="stats.tooltip-copy"
                                            ns="p2p"
                                            values={{ amount: balanceFMT, time: miningTime }}
                                            components={{ strong: <strong /> }}
                                        />

                                        {t('stats.tooltip-copy')}
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
