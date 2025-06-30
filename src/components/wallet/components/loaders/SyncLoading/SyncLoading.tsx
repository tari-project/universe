import LoadingDots from '@app/components/elements/loaders/LoadingDots';
import {
    Line,
    LoadingWrapper,
    Text,
    TooltipContent,
    TooltipDescription,
    TooltipPosition,
    TooltipTitle,
    Wrapper,
} from './styles';
import { useEffect, useRef, useState } from 'react';
import { useFloating, useHover, useInteractions, offset, shift, FloatingPortal } from '@floating-ui/react';
import { AnimatePresence } from 'motion/react';
import Countdown from 'react-countdown';
import { useTranslation } from 'react-i18next';
import { useProgressCountdown } from '@app/containers/main/Sync/components/useProgressCountdown.ts';
import { useMiningMetricsStore } from '@app/store';

export default function SyncLoading() {
    const { t } = useTranslation(['wallet', 'setup-progresses']);
    const cpuMining = useMiningMetricsStore((s) => s.cpu_mining_status.is_mining);
    const gpuMining = useMiningMetricsStore((s) => s.gpu_mining_status.is_mining);

    const isMining = cpuMining || gpuMining;
    const [open, setOpen] = useState(false);
    const countdownRef = useRef<Countdown | null>(null);
    const { countdown } = useProgressCountdown();
    const date = new Date(Date.now() + countdown * 1000);
    const { refs, context, floatingStyles } = useFloating({
        open,
        onOpenChange: setOpen,
        middleware: [offset(32), shift()],
        placement: 'right',
    });
    const hover = useHover(context);
    const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

    const renderer = ({ hours, minutes, completed, api }) => {
        if (!api.isStarted()) {
            return t('setup-progresses:calculating_time');
        }
        return completed ? t('sync-message.completed') : `${hours}h ${minutes.toString().padStart(2, '0')}m`;
    };

    useEffect(() => {
        const api = countdownRef.current?.getApi();

        if (api && countdown > 0) {
            api.start();
        }
    }, [countdown]);

    return (
        <>
            <Wrapper ref={refs.setReference} {...getReferenceProps()}>
                <Text>
                    <Line>
                        {t('sync-message.line1')}
                        <strong>
                            <Countdown ref={countdownRef} date={date} autoStart={false} renderer={renderer} />
                            {countdown > 0 && t('sync-message.line2')}
                        </strong>
                    </Line>
                    <Line>{countdown > 0 && t('sync-message.line3')}</Line>
                </Text>
                <LoadingWrapper>
                    <LoadingDots />
                </LoadingWrapper>
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
