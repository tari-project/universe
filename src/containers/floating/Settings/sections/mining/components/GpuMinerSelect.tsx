import { useCallback, useEffect, useRef, useState } from 'react';
import { HiOutlineSelector } from 'react-icons/hi';
import {
    autoUpdate,
    offset,
    useClick,
    useDismiss,
    useFloating,
    useInteractions,
    useRole,
    useListNavigation,
    FloatingFocusManager,
} from '@floating-ui/react';

import { Typography } from '@app/components/elements/Typography.tsx';
import { Chip } from '@app/components/elements/Chip.tsx';
import CheckSvg from '@app/components/svgs/CheckSvg.tsx';
import { GpuMiner, GpuMinerType, GpuMinerFeature, GpuMiningAlgorithm } from '@app/types/events-payloads.ts';
import {
    Wrapper,
    TriggerWrapper,
    TriggerContent,
    TriggerTitle,
    TriggerSummary,
    HealthIndicator,
    ChipsContainer,
    ChipsSeparator,
    IconWrapper,
    OptionsPosition,
    Options,
    OptionItem,
    OptionHeader,
    OptionTitleRow,
    OptionSummary,
} from './GpuMinerSelect.styles';

interface Props {
    miners: GpuMiner[];
    selectedMiner?: GpuMiner;
    onChange: (minerType: GpuMinerType) => void;
    hideChips?: boolean;
}

const minerLabel = {
    [GpuMinerType.LolMiner]: 'LolMiner',
    [GpuMinerType.Glytex]: 'Glytex',
    [GpuMinerType.Graxil]: 'Graxil',
};

const generateMinerSummary = (miner: GpuMiner): string => {
    const features = miner.features;
    const algorithms = miner.supported_algorithms;

    // Mining type
    const miningTypes: string[] = [];
    if (features.includes(GpuMinerFeature.SoloMining)) miningTypes.push('solo');
    if (features.includes(GpuMinerFeature.PoolMining)) miningTypes.push('pool');
    const miningTypeText = miningTypes.length > 0 ? miningTypes.join(' and ') + ' mining' : 'mining';

    // Algorithms
    const algorithmText =
        algorithms.length > 1
            ? algorithms.join(' and ')
            : algorithms.length === 1
              ? algorithms[0]
              : 'various algorithms';

    // Available features
    const availableFeatures: string[] = [];
    if (features.includes(GpuMinerFeature.DeviceExclusion)) availableFeatures.push('device exclusion');
    if (features.includes(GpuMinerFeature.MiningIntensity)) availableFeatures.push('GPU usage control');
    if (features.includes(GpuMinerFeature.EngineSelection)) availableFeatures.push('engine selection');

    const featuresText =
        availableFeatures.length > 0
            ? ' with ' +
              (availableFeatures.length > 1
                  ? availableFeatures.slice(0, -1).join(', ') + ' and ' + availableFeatures.slice(-1)
                  : availableFeatures[0])
            : '';

    return `Supports ${miningTypeText} on ${algorithmText}${featuresText}`;
};

export function GpuMinerSelect({ miners, selectedMiner, onChange, hideChips }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const listRef = useRef<(HTMLElement | null)[]>([]);

    const { update, refs, elements, context, floatingStyles } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
        placement: 'bottom-start',
        middleware: [offset({ mainAxis: 5 })],
    });

    const click = useClick(context);
    const dismiss = useDismiss(context);
    const role = useRole(context, { role: 'listbox' });
    const listNavigation = useListNavigation(context, {
        listRef,
        activeIndex,
        onNavigate: setActiveIndex,
        virtual: true,
        loop: false,
    });

    const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
        click,
        dismiss,
        role,
        listNavigation,
    ]);

    useEffect(() => {
        if (isOpen && elements.reference && elements.floating) {
            return autoUpdate(elements.reference, elements.floating, update, {
                layoutShift: false,
                ancestorResize: false,
            });
        }
    }, [isOpen, elements, update]);

    useEffect(() => {
        if (isOpen) {
            const selectedIndex = miners.findIndex((miner) => miner.miner_type === selectedMiner?.miner_type);
            const initialIndex = selectedIndex >= 0 ? selectedIndex : 0;
            setActiveIndex(initialIndex);
        } else {
            setActiveIndex(null);
        }
    }, [isOpen, miners, selectedMiner]);

    const handleMinerSelect = useCallback(
        (minerType: GpuMinerType) => {
            onChange(minerType);
            setIsOpen(false);
        },
        [onChange]
    );

    const renderFeatureChip = (feature: GpuMinerFeature) => (
        <Chip key={feature} size="small" background="#1E40AF" color="white">
            {feature}
        </Chip>
    );

    const renderAlgorithmChip = (algorithm: GpuMiningAlgorithm) => (
        <Chip key={algorithm} size="small" background="#B45309" color="white">
            {algorithm}
        </Chip>
    );

    return (
        <Wrapper>
            <TriggerWrapper
                ref={refs.setReference}
                {...getReferenceProps()}
                $isHealthy={selectedMiner?.is_healthy}
                $hasSelection={!!selectedMiner}
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                tabIndex={0}
            >
                <TriggerContent>
                    <TriggerTitle>
                        <HealthIndicator $isHealthy={selectedMiner?.is_healthy ?? true} />
                        <Typography variant="span">
                            {selectedMiner ? minerLabel[selectedMiner.miner_type] : 'Select GPU Miner'}
                        </Typography>
                        {selectedMiner && !selectedMiner.is_healthy && selectedMiner.last_error && (
                            <Typography
                                variant="span"
                                style={{
                                    fontSize: '11px',
                                    color: '#EF4444',
                                    fontWeight: 600,
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                }}
                            >
                                {`Failed with: ${selectedMiner.last_error}`}
                            </Typography>
                        )}
                    </TriggerTitle>
                    {selectedMiner && <TriggerSummary>{generateMinerSummary(selectedMiner)}</TriggerSummary>}
                    {selectedMiner && !hideChips && (
                        <ChipsContainer>
                            {selectedMiner.features.map(renderFeatureChip)}
                            {selectedMiner.features.length > 0 && selectedMiner.supported_algorithms.length > 0 && (
                                <ChipsSeparator />
                            )}
                            {selectedMiner.supported_algorithms.map(renderAlgorithmChip)}
                        </ChipsContainer>
                    )}
                </TriggerContent>
                <IconWrapper>
                    <HiOutlineSelector />
                </IconWrapper>
            </TriggerWrapper>
            {isOpen && (
                <FloatingFocusManager context={context} modal={true} initialFocus={activeIndex || 0}>
                    <OptionsPosition ref={refs.setFloating} {...getFloatingProps()} style={floatingStyles}>
                        <Options role="listbox">
                            {miners.map((miner, index) => {
                                const selected = miner.miner_type === selectedMiner?.miner_type;
                                const isActive = activeIndex === index;
                                return (
                                    <OptionItem
                                        ref={(node) => {
                                            listRef.current[index] = node;
                                        }}
                                        key={miner.miner_type}
                                        onClick={() => handleMinerSelect(miner.miner_type)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleMinerSelect(miner.miner_type);
                                            }
                                        }}
                                        $selected={selected}
                                        $isActive={isActive}
                                        $isHealthy={miner.is_healthy}
                                        role="option"
                                        aria-selected={selected}
                                        tabIndex={isActive ? 0 : -1}
                                        {...getItemProps({
                                            onClick() {
                                                handleMinerSelect(miner.miner_type);
                                            },
                                        })}
                                    >
                                        <OptionHeader>
                                            <OptionTitleRow>
                                                <HealthIndicator $isHealthy={miner.is_healthy} />
                                                <Typography variant="span">{minerLabel[miner.miner_type]}</Typography>
                                                {!miner.is_healthy && miner.last_error && (
                                                    <Typography
                                                        variant="span"
                                                        style={{
                                                            fontSize: '11px',
                                                            color: '#EF4444',
                                                            fontWeight: 600,
                                                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            border: '1px solid rgba(239, 68, 68, 0.3)',
                                                        }}
                                                    >
                                                        {`Failed with: ${miner.last_error}`}
                                                    </Typography>
                                                )}
                                            </OptionTitleRow>
                                            {selected && (
                                                <IconWrapper>
                                                    <CheckSvg />
                                                </IconWrapper>
                                            )}
                                        </OptionHeader>
                                        <OptionSummary>{generateMinerSummary(miner)}</OptionSummary>
                                        {!hideChips && (
                                            <ChipsContainer>
                                                {miner.features.map(renderFeatureChip)}
                                                {miner.features.length > 0 && miner.supported_algorithms.length > 0 && (
                                                    <ChipsSeparator />
                                                )}
                                                {miner.supported_algorithms.map(renderAlgorithmChip)}
                                            </ChipsContainer>
                                        )}
                                    </OptionItem>
                                );
                            })}
                        </Options>
                    </OptionsPosition>
                </FloatingFocusManager>
            )}
        </Wrapper>
    );
}
