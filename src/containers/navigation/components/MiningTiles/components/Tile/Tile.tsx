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
import { useState } from 'react';
import SyncData from '@app/containers/navigation/components/MiningTiles/components/SyncData/SyncData.tsx';
import { useMiningMetricsStore } from '@app/store';

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
}: Props) {
    const isGPU = title === 'GPU';
    const isConnectedToTariNetwork = useMiningMetricsStore((s) => s.isNodeConnected);
    const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

    const syncing = isGPU && !isConnectedToTariNetwork;
    const syncMarkup = syncing && <SyncData />;
    const renderPill = isGPU && syncing;

    const pillCopy = isLoading || !isMining ? `- ${pillUnit}` : `${pillValue} ${pillUnit}`;
    const pillMarkup = renderPill && <RatePill>{pillCopy}</RatePill>;

    const mainMarkup = !syncing && (
        <NumberGroup>
            {(isLoading || !isMining) && mainUnit !== 'XTM' ? (
                <BigNumber>
                    <Number $isLoading>{`-`}</Number>
                </BigNumber>
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
                        />
                    </Number>
                    <NumberUnit>{mainUnit}</NumberUnit>
                </BigNumber>
            )}
            <NumberLabel>{mainLabel}</NumberLabel>
        </NumberGroup>
    );

    return (
        <Wrapper>
            <Inside>
                <HeadingRow>
                    <LabelWrapper>
                        <StatusDot $isMining={isMining} $isEnabled={isEnabled} $isSyncing={syncing} />
                        <LabelText>{title}</LabelText>
                    </LabelWrapper>

                    {pillMarkup}
                </HeadingRow>
                {syncMarkup}
                {mainMarkup}
            </Inside>

            <AnimatePresence>
                {isMining && (
                    <AnimatedGlowPosition>
                        <AnimatedGlow />
                    </AnimatedGlowPosition>
                )}
            </AnimatePresence>

            <SuccessAnimation value={1.235} unit="XTM" show={showSuccessAnimation} setShow={setShowSuccessAnimation} />
        </Wrapper>
    );
}
