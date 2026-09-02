import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import CheckSvg from '@app/components/svgs/CheckSvg.tsx';
import { GpuMiner, GpuMinerType } from '@app/types/events-payloads.ts';
import {
    Wrapper,
    TriggerWrapper,
    TriggerContent,
    TriggerTitle,
    TriggerSummary,
    HealthIndicator,
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
    disabled?: boolean;
}

const errorLabelStyle = {
    fontSize: '11px',
    color: '#EF4444',
    fontWeight: 600,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: '2px 6px',
    borderRadius: '4px',
    border: '1px solid rgba(239, 68, 68, 0.3)',
};

export function GpuMinerSelect({ miners, selectedMiner, onChange, disabled }: Props) {
    const { t } = useTranslation('settings', { useSuspense: false });
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const listRef = useRef<(HTMLElement | null)[]>([]);

    const { update, refs, elements, context, floatingStyles } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
        placement: 'bottom-start',
        middleware: [offset({ mainAxis: 5 })],
    });

    const click = useClick(context, { enabled: !disabled });
    const dismiss = useDismiss(context);
    const role = useRole(context, { role: 'listbox' });
    // Not virtual: without real DOM focus on the items, useListNavigation moves the highlight but
    // leaves focus on whichever item was focused first, and the item's own key handler is the only
    // thing that selects - so Enter would pick the highlighted-from miner, not the highlighted one.
    const listNavigation = useListNavigation(context, {
        listRef,
        activeIndex,
        onNavigate: setActiveIndex,
        loop: true,
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

    const renderError = (miner: GpuMiner) =>
        !miner.is_healthy &&
        miner.last_error && (
            <Typography variant="span" style={errorLabelStyle}>
                {t('gpu-miner-failed-with', { error: miner.last_error })}
            </Typography>
        );

    return (
        <Wrapper>
            <TriggerWrapper
                ref={refs.setReference}
                {...getReferenceProps()}
                $isHealthy={selectedMiner?.is_healthy}
                $hasSelection={!!selectedMiner}
                $disabled={disabled}
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-disabled={disabled}
                tabIndex={disabled ? -1 : 0}
            >
                <TriggerContent>
                    <TriggerTitle>
                        <HealthIndicator $isHealthy={selectedMiner?.is_healthy ?? true} />
                        <Typography variant="span">
                            {selectedMiner ? selectedMiner.miner_type : t('gpu-miner-select-placeholder')}
                        </Typography>
                        {selectedMiner && renderError(selectedMiner)}
                    </TriggerTitle>
                    {selectedMiner && (
                        <TriggerSummary>{t(`gpu-miner-description.${selectedMiner.miner_type}`)}</TriggerSummary>
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
                                                <Typography variant="span">{miner.miner_type}</Typography>
                                                {renderError(miner)}
                                            </OptionTitleRow>
                                            {selected && (
                                                <IconWrapper>
                                                    <CheckSvg />
                                                </IconWrapper>
                                            )}
                                        </OptionHeader>
                                        <OptionSummary>{t(`gpu-miner-description.${miner.miner_type}`)}</OptionSummary>
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
