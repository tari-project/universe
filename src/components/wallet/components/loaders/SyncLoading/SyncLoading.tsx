import LoadingDots from '@app/components/elements/loaders/LoadingDots';
import {
    Line,
    LoadingGroup,
    LoadingWrapper,
    Text,
    TextTop,
    TooltipContent,
    TooltipDescription,
    TooltipPosition,
    TooltipTitle,
    Wrapper,
} from './styles';
import { useState } from 'react';
import { useFloating, useHover, useInteractions, offset, shift, FloatingPortal } from '@floating-ui/react';
import { AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useMiningMetricsStore } from '@app/store';
import SyncCountdown from '@app/components/wallet/components/loaders/SyncLoading/SyncCountdown.tsx';

export default function SyncLoading() {
    const { t } = useTranslation(['wallet', 'setup-progresses']);

    const cpuMining = useMiningMetricsStore((s) => s.cpu_mining_status.is_mining);
    const gpuMining = useMiningMetricsStore((s) => s.gpu_mining_status.is_mining);
    const isMining = cpuMining || gpuMining;

    const [open, setOpen] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [isStarted, setIsStarted] = useState(false);
    const { refs, context, floatingStyles } = useFloating({
        open,
        onOpenChange: setOpen,
        middleware: [offset(32), shift()],
        placement: 'right',
    });
    const hover = useHover(context);
    const { getReferenceProps, getFloatingProps } = useInteractions([hover]);
    return (
        <>
            <Wrapper ref={refs.setReference} {...getReferenceProps()}>
                {isMining && <TextTop>{t('sync-message.top-line')}</TextTop>}
                <LoadingGroup>
                    <Text>
                        <Line>
                            <strong>
                                <SyncCountdown
                                    onStarted={() => setIsStarted(true)}
                                    onCompleted={() => setIsComplete(true)}
                                />
                                {isStarted && !isComplete && t('sync-message.line2')}
                            </strong>
                        </Line>
                        <Line>{t('sync-message.line3')}</Line>
                    </Text>
                    <LoadingWrapper>
                        <LoadingDots />
                    </LoadingWrapper>
                </LoadingGroup>
            </Wrapper>
            <AnimatePresence>
                {open && (
                    <FloatingPortal>
                        <TooltipPosition ref={refs.setFloating} {...getFloatingProps()} style={floatingStyles}>
                            <TooltipContent
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                            >
                                <TooltipTitle>{t('sync-message.tooltip-title')}</TooltipTitle>
                                <TooltipDescription>
                                    {t('sync-message.tooltip-description', { context: isMining && 'mining' })}
                                </TooltipDescription>
                            </TooltipContent>
                        </TooltipPosition>
                    </FloatingPortal>
                )}
            </AnimatePresence>
        </>
    );
}
