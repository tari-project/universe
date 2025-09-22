import i18n from 'i18next';
import { Ref, useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import NumberFlow from '@number-flow/react';
import { useConfigUIStore, useNodeStore, useUIStore } from '@app/store';
import SuccessAnimation from '../SuccessAnimation/SuccessAnimation';
import SyncData from '@app/containers/navigation/components/MiningTiles/components/SyncData/SyncData.tsx';
import LoadingDots from '@app/components/elements/loaders/LoadingDots.tsx';
import {
    AnimatedGlow,
    AnimatedGlowPosition,
    Inside,
    Wrapper,
    HeadingRow,
    StatusDot,
    LabelText,
    RatePill,
    NumberGroup,
    BigNumber,
    Number,
    NumberLabel,
    LabelWrapper,
    NumberUnit,
} from './styles';
import { UseInteractionsReturn } from '@floating-ui/react';
import { setAnimationState, animationStatus } from '@tari-project/tari-tower';
import { PoolType } from '@app/store/useMiningPoolsStore.ts';
import { clearCurrentSuccessValue } from '@app/store/actions/miningPoolsStoreActions.ts';
import { AppModuleState, AppModuleStatus } from '@app/store/types/setup';
import { setDialogToShow } from '@app/store/actions/uiStoreActions';
import alertEmoji from '/assets/img/icons/emoji/alert_emoji.png';

interface Props {
    title: PoolType;
    isLoading: boolean;
    isMining: boolean;
    isEnabled: boolean;
    pillValue?: number;
    pillUnit?: string;
    mainNumber: number;
    mainUnit: string;
    mainLabel: string;
    successValue?: number | null;
    isIdle?: boolean;
    isSoloMining?: boolean;
    tooltipTriggerRef?: Ref<HTMLDivElement>;
    getReferenceProps?: UseInteractionsReturn['getReferenceProps'];
    minerModuleState: AppModuleState;
}

export default function Tile({
    title,
    isLoading,
    isMining,
    pillValue,
    pillUnit,
    mainNumber,
    mainUnit,
    mainLabel,
    isEnabled,
    successValue,
    isIdle,
    tooltipTriggerRef,
    getReferenceProps,
    isSoloMining,
    minerModuleState,
}: Props) {
    const isModuleFailed = minerModuleState?.status === AppModuleStatus.Failed;
    const animationState = animationStatus;
    const visualMode = useConfigUIStore((s) => s.visual_mode);

    const towerInitalized = useUIStore((s) => s.towerInitalized);
    const isConnectedToTariNetwork = useNodeStore((s) => s.isNodeConnected);
    const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

    const canAnimateTower = useMemo(() => {
        return visualMode && towerInitalized && animationState === 'free' && !isLoading;
    }, [animationState, visualMode, isLoading, towerInitalized]);

    useEffect(() => {
        if (!successValue || isLoading) return;
        setShowSuccessAnimation(successValue > 0);
        const resetTimer = setTimeout(() => {
            clearCurrentSuccessValue(title);
            setShowSuccessAnimation(false);
        }, 3000);
        return () => {
            clearTimeout(resetTimer);
        };
    }, [isLoading, successValue, title]);

    const handleClick = () => {
        if (isModuleFailed) {
            setDialogToShow('failedModuleInitialization');
        }
    };

    useEffect(() => {
        if (!canAnimateTower) return;
        if (showSuccessAnimation) {
            setAnimationState('success', true);
        }
    }, [canAnimateTower, showSuccessAnimation]);

    const syncing = isSoloMining && isEnabled && !isConnectedToTariNetwork;
    const gpuIdle = isSoloMining && !isMining;

    const syncMarkup = syncing && <SyncData />;
    const renderPill = isSoloMining ? syncing : true;

    const pillCopy = isLoading || !isMining ? `- ${pillUnit}` : `${pillValue} ${pillUnit}`;
    const pillMarkup = renderPill && <RatePill>{pillCopy}</RatePill>;

    const gpuIdleMarkup = (
        <BigNumber>
            <Number $isIdle>{`-`}</Number>
            <NumberUnit>{mainUnit}</NumberUnit>
        </BigNumber>
    );

    const numberMarkup = gpuIdle ? (
        gpuIdleMarkup
    ) : (
        <BigNumber>
            <Number>
                <NumberFlow
                    locales={i18n.language}
                    format={{
                        minimumFractionDigits: mainNumber > 0 ? 1 : 0,
                        maximumFractionDigits: 4,
                        notation: 'standard',
                        style: 'decimal',
                    }}
                    value={mainNumber}
                    animated={!isIdle}
                />
            </Number>

            <NumberUnit>{mainUnit}</NumberUnit>
        </BigNumber>
    );
    const mainMarkup = !syncing && (
        <NumberGroup>
            {isLoading || isModuleFailed ? <LoadingDots /> : numberMarkup}
            <NumberLabel>{mainLabel}</NumberLabel>
        </NumberGroup>
    );

    return (
        <Wrapper
            key={title}
            ref={tooltipTriggerRef}
            {...getReferenceProps?.()}
            onClick={handleClick}
            $isModuleFailed={isModuleFailed}
        >
            <Inside $isSyncing={syncing || isLoading}>
                <HeadingRow>
                    <LabelWrapper>
                        {isModuleFailed ? (
                            <img src={alertEmoji} alt="Alert icon" />
                        ) : (
                            <StatusDot $isMining={isMining} $isEnabled={isEnabled} $isSyncing={syncing || isLoading} />
                        )}
                        <LabelText>{title}</LabelText>
                    </LabelWrapper>
                    {pillMarkup}
                </HeadingRow>
                {syncMarkup}
                {mainMarkup}
            </Inside>

            <AnimatePresence>
                {isMining && !isLoading && !syncing && (
                    <AnimatedGlowPosition>
                        <AnimatedGlow />
                    </AnimatedGlowPosition>
                )}
            </AnimatePresence>

            <SuccessAnimation
                key={`success-${title}`}
                value={successValue || 0}
                unit="XTM"
                show={showSuccessAnimation}
                setShow={setShowSuccessAnimation}
            />
        </Wrapper>
    );
}
