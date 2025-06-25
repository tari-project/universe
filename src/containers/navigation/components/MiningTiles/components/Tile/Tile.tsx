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

interface Props {
    title: string;
    isLoading: boolean;
    isMining: boolean;
    pillValue: string;
    pillUnit: string;
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
}: Props) {
    const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

    const syncing = title === 'GPU';
    const syncMarkup = syncing && <SyncData />;
    const mainMarkup = !syncing && (
        <NumberGroup>
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
            <NumberLabel>{mainLabel}</NumberLabel>
        </NumberGroup>
    );

    return (
        <Wrapper>
            <Inside>
                <HeadingRow>
                    <LabelWrapper>
                        <StatusDot $isMining={isMining} />
                        <LabelText>{title}</LabelText>
                    </LabelWrapper>

                    <RatePill>{isLoading ? `- ${pillUnit}` : `${pillValue} ${pillUnit}`}</RatePill>
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

            <SuccessAnimation value={1.25} unit="XTM" show={showSuccessAnimation} setShow={setShowSuccessAnimation} />
        </Wrapper>
    );
}
