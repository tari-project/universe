import i18n from 'i18next';
import { Ref, useEffect, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import NumberFlow from '@number-flow/react';
import { useMiningMetricsStore } from '@app/store';
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

interface Props {
    title: string;
    isLoading: boolean;
    isMining: boolean;
    isEnabled: boolean;
    pillValue?: number;
    pillUnit?: string;
    mainNumber: number;
    mainUnit: string;
    mainLabel: string;
    successValue?: number;
    isIdle?: boolean;
    isSoloMining?: boolean;
    tooltipTriggerRef?: Ref<HTMLDivElement>;
    getReferenceProps?: UseInteractionsReturn['getReferenceProps'];
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
}: Props) {
    const isConnectedToTariNetwork = useMiningMetricsStore((s) => s.isNodeConnected);
    const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

    useEffect(() => {
        setShowSuccessAnimation(!!successValue);
    }, [successValue]);

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
            {isLoading ? <LoadingDots /> : numberMarkup}
            <NumberLabel ref={tooltipTriggerRef} {...getReferenceProps?.()}>
                {mainLabel}
            </NumberLabel>
        </NumberGroup>
    );

    return (
        <Wrapper>
            <Inside $isSyncing={syncing || isLoading}>
                <HeadingRow>
                    <LabelWrapper>
                        <StatusDot $isMining={isMining} $isEnabled={isEnabled} $isSyncing={syncing || isLoading} />
                        <LabelText>{title}</LabelText>
                    </LabelWrapper>

                    {pillMarkup}
                </HeadingRow>
                {syncMarkup}
                {mainMarkup}
            </Inside>

            <AnimatePresence>
                {isMining && !isLoading && (
                    <AnimatedGlowPosition>
                        <AnimatedGlow />
                    </AnimatedGlowPosition>
                )}
            </AnimatePresence>

            <SuccessAnimation
                value={successValue || 0}
                unit="XTM"
                show={showSuccessAnimation}
                setShow={setShowSuccessAnimation}
            />
        </Wrapper>
    );
}
