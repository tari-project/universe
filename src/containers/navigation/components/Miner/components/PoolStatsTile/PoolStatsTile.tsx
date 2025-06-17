import i18n from 'i18next';
import { useConfigMiningStore, useConfigUIStore, useMiningMetricsStore } from '@app/store';

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
import { useEffect, useRef, useState } from 'react';
import { offset, safePolygon, useFloating, useHover, useInteractions } from '@floating-ui/react';
import NumberFlow from '@number-flow/react';

import { AnimatePresence } from 'motion/react';
import { MiningTime } from '@app/components/mining/timer/MiningTime.tsx';
import { useMiningTime } from '@app/hooks/mining/useMiningTime.ts';
import { SuccessAnimation } from './SuccessAnimation/SuccessAnimation';
import { setAnimationState } from '@tari-project/tari-tower';

import { ProgressAnimation } from './ProgressAnimation/ProgressAnimation';

const REWARD_THRESHOLD_STR = `2 XTM`;
const REWARD_THRESHOLD = 2 * 1_000_000;
const fmtMatch = (value: number) =>
    Intl.NumberFormat(i18n.language, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
        notation: 'standard',
        style: 'decimal',
    }).format(value);
export const PoolStatsTile = () => {
    const { t } = useTranslation('p2p');
    const { daysString, hoursString, minutes, seconds } = useMiningTime();
    const pool_status = useMiningMetricsStore((s) => s.cpu_mining_status.pool_status);
    console.log('Pool Status:', pool_status);
    const isMining = useMiningMetricsStore((s) => s.cpu_mining_status.is_mining);
    const cpuMiningEnabled = useConfigMiningStore((s) => s.cpu_mining_enabled);
    const visualMode = useConfigUIStore((s) => s.visual_mode);
    const loading = isMining && !pool_status;
    const [expanded, setExpanded] = useState(false);
    const [unpaid, setUnpaid] = useState(pool_status?.unpaid || 0);
    const [unpaidFMT, setUnpaidFTM] = useState(fmtMatch(unpaid));
    const [prevUnpaid, setPrevUnpaid] = useState(unpaidFMT);

    const [showProgressAnimation, setShowProgressAnimation] = useState(false);
    const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

    const prevFloored = useRef(Math.floor((pool_status?.unpaid || 0) / 1_000_000));

    useEffect(() => {
        setUnpaid(pool_status?.unpaid || 0);
        setUnpaidFTM(fmtMatch(pool_status?.unpaid || 0));
    }, [pool_status?.unpaid]);

    useEffect(() => {
        if (unpaidFMT > prevUnpaid) {
            setShowProgressAnimation(true);
            const timer = setTimeout(() => setShowProgressAnimation(false), 5000);
            return () => clearTimeout(timer);
        }
        setPrevUnpaid(unpaidFMT);
    }, [unpaidFMT, prevUnpaid]);

    useEffect(() => {
        const unpaidAboveThreshold = unpaid >= REWARD_THRESHOLD;
        if (!unpaidAboveThreshold) return;
        const floored = Math.floor(unpaid / 1_000_000);
        const canShowSuccess = floored === 2 && prevFloored.current !== floored && prevUnpaid !== '0.00';
        if (canShowSuccess) {
            setShowSuccessAnimation(true);
            if (visualMode) {
                setAnimationState('success', true);
            }

            prevFloored.current = floored;
        }
    }, [unpaid, visualMode, prevUnpaid]);

    // ================== Floating UI ==================

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

    // ================== Render ==================

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
                                        <BalanceVal>
                                            <NumberFlow
                                                locales={i18n.language}
                                                format={{
                                                    minimumFractionDigits: 1,
                                                    maximumFractionDigits: 4,
                                                    notation: 'standard',
                                                    style: 'decimal',
                                                }}
                                                value={unpaid / 1_000_000}
                                                suffix=" XTM"
                                            />
                                        </BalanceVal>
                                    </Values>
                                </LeftContent>
                                <RightContent>
                                    <TriggerWrapper ref={refs.setReference} {...getReferenceProps()}>
                                        <QuestionMarkSvg />
                                    </TriggerWrapper>
                                    <MiningTime timing={{ daysString, hoursString, minutes, seconds }} variant="mini" />
                                </RightContent>
                                <ProgressAnimation
                                    isVisible={showProgressAnimation}
                                    setIsVisible={setShowProgressAnimation}
                                />
                            </>
                        )}
                    </Inside>
                    <AnimatedGradient $isLoading={loading} $isMining={isMining} />
                </Border>
                <SuccessAnimation
                    isVisible={showSuccessAnimation}
                    setIsVisible={setShowSuccessAnimation}
                    rewardThreshold={REWARD_THRESHOLD_STR}
                    rewardCopy={t('stats.earned')}
                />
            </Wrapper>
            <AnimatePresence>
                {expanded && (
                    <ExpandedWrapper ref={refs.setFloating} {...getFloatingProps()} style={floatingStyles}>
                        <ExpandedBox
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                        >
                            <Typography variant="h5">{t('stats.tile-heading')}</Typography>
                            <Typography variant="p">
                                <Trans
                                    i18nKey="stats.tooltip-copy"
                                    ns="p2p"
                                    values={{ amount: REWARD_THRESHOLD_STR }}
                                    components={{ strong: <strong /> }}
                                />
                            </Typography>
                            <TooltipChipWrapper>
                                <TooltipChip>
                                    <MiningTime timing={{ daysString, hoursString, minutes, seconds }} />
                                </TooltipChip>
                                <TooltipChip>
                                    <TooltipChipHeading>{t('stats.tooltip-tile-heading')}</TooltipChipHeading>
                                    <TooltipChipText>{REWARD_THRESHOLD_STR}</TooltipChipText>
                                </TooltipChip>
                            </TooltipChipWrapper>
                        </ExpandedBox>
                    </ExpandedWrapper>
                )}
            </AnimatePresence>
        </>
    );
};
