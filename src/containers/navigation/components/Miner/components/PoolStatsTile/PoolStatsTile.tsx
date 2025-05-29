import { useConfigMiningStore, useMiningMetricsStore } from '@app/store';
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
    TooltipChip,
    TooltipChipWrapper,
    TooltipChipHeading,
    TooltipChipText,
    ExpandedBox,
    Border,
    AnimatedGradient,
    Inside,
} from './styles';
import { Trans, useTranslation } from 'react-i18next';
import { Typography } from '@app/components/elements/Typography.tsx';
import QuestionMarkSvg from '@app/components/svgs/QuestionMarkSvg.tsx';
import { useState } from 'react';
import { offset, safePolygon, useFloating, useHover, useInteractions } from '@floating-ui/react';

import { AnimatePresence } from 'motion/react';
import { MiningTime } from '@app/components/mining/timer/MiningTime.tsx';
import { useMiningTime } from '@app/hooks/mining/useMiningTime.ts';
import { SuccessAnimation } from './SuccessAnimation/SuccessAnimation';

const variants = {
    hidden: {
        opacity: 0,
        x: 10,
    },
    visible: {
        opacity: 1,
        x: 0,
    },
};

const REWARD_THRESHOLD = `2 XTM`;

export const PoolStatsTile = () => {
    const { t } = useTranslation('p2p');
    const { daysString, hoursString, minutes, seconds } = useMiningTime();
    const pool_status = useMiningMetricsStore((s) => s.cpu_mining_status.pool_status);
    const isMining = useMiningMetricsStore((s) => s.cpu_mining_status.is_mining);
    const cpuMiningEnabled = useConfigMiningStore((s) => s.cpu_mining_enabled);
    const loading = isMining && !pool_status;
    const unpaidFMT = formatNumber(pool_status?.unpaid || 0, FormatPreset.XTM_LONG_DEC);
    const [expanded, setExpanded] = useState(false);

    const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

    const { refs, context, floatingStyles } = useFloating({
        open: expanded,
        onOpenChange: setExpanded,
        placement: 'right',
        middleware: [offset({ mainAxis: 30 })],
    });

    const hover = useHover(context, {
        move: !expanded,
        handleClose: safePolygon(),
    });

    const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

    return !cpuMiningEnabled ? null : (
        <>
            <Wrapper>
                <Border $isLoading={loading} $isMining={isMining}>
                    <Inside $isLoading={loading} $isMining={isMining}>
                        {loading ? (
                            <Title style={{ textAlign: 'center' }}>{`${t('stats.tile-loading')}...`}</Title>
                        ) : (
                            <>
                                <LeftContent>
                                    <Title>{t('stats.tile-heading')}</Title>
                                    <Values>
                                        <BalanceVal>{`${unpaidFMT} XTM`}</BalanceVal>
                                    </Values>
                                </LeftContent>
                                <RightContent>
                                    <TriggerWrapper ref={refs.setReference} {...getReferenceProps()}>
                                        <QuestionMarkSvg />
                                    </TriggerWrapper>
                                    <MiningTime timing={{ daysString, hoursString, minutes, seconds }} variant="mini" />
                                </RightContent>
                            </>
                        )}
                    </Inside>
                    <AnimatedGradient $isLoading={loading} $isMining={isMining} />
                </Border>
                <SuccessAnimation
                    isVisible={showSuccessAnimation}
                    setIsVisible={setShowSuccessAnimation}
                    rewardThreshold={REWARD_THRESHOLD}
                />
            </Wrapper>
            <AnimatePresence>
                {expanded && (
                    <ExpandedWrapper ref={refs.setFloating} {...getFloatingProps()} style={floatingStyles}>
                        <ExpandedBox variants={variants} initial="hidden" animate="visible" exit="hidden">
                            <Typography variant="h5">{t('stats.tile-heading')}</Typography>
                            <Typography variant="p">
                                <Trans
                                    i18nKey="stats.tooltip-copy"
                                    ns="p2p"
                                    values={{ amount: REWARD_THRESHOLD }}
                                    components={{ strong: <strong /> }}
                                />
                            </Typography>
                            <TooltipChipWrapper>
                                <TooltipChip>
                                    <MiningTime timing={{ daysString, hoursString, minutes, seconds }} />
                                </TooltipChip>
                                <TooltipChip>
                                    <TooltipChipHeading>{t('stats.tooltip-tile-heading')}</TooltipChipHeading>
                                    <TooltipChipText>{REWARD_THRESHOLD}</TooltipChipText>
                                </TooltipChip>
                            </TooltipChipWrapper>
                        </ExpandedBox>
                    </ExpandedWrapper>
                )}
            </AnimatePresence>
        </>
    );
};
