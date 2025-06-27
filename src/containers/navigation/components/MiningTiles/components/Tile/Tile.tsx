import i18n from 'i18next';
import { AnimatePresence } from 'motion/react';
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
import NumberFlow from '@number-flow/react';
import SuccessAnimation from '../SuccessAnimation/SuccessAnimation';
import { useEffect, useState } from 'react';
import SyncData from '@app/containers/navigation/components/MiningTiles/components/SyncData/SyncData.tsx';
import { useMiningMetricsStore } from '@app/store';
import LoadingDots from '@app/components/elements/loaders/LoadingDots.tsx';

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
}: Props) {
    const isGPU = title === 'GPU';
    const isConnectedToTariNetwork = useMiningMetricsStore((s) => s.isNodeConnected);
    const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

    useEffect(() => {
        setShowSuccessAnimation(!!successValue);
    }, [successValue]);

    const syncing = isGPU && isEnabled && !isConnectedToTariNetwork;
    const gpuIdle = isGPU && !isMining;

    const syncMarkup = syncing && <SyncData />;
    const renderPill = isGPU ? syncing : true;

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
                        minimumFractionDigits: 1,
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
            <NumberLabel>{mainLabel}</NumberLabel>
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
