import { TooltipContent, TooltipDescription, TooltipPosition, TooltipTitle, Wrapper } from './styles';
import { ReactNode, useState } from 'react';
import { useFloating, useHover, useInteractions, offset, shift, FloatingPortal } from '@floating-ui/react';
import { AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useMiningMetricsStore } from '@app/store';

export default function SyncLoading({ children }: { children: ReactNode }) {
    const { t } = useTranslation(['wallet', 'setup-progresses']);

    const cpuMining = useMiningMetricsStore((s) => s.cpu_mining_status.is_mining);
    const gpuMining = useMiningMetricsStore((s) => s.gpu_mining_status.is_mining);
    const isMining = cpuMining || gpuMining;

    const [open, setOpen] = useState(false);
    const { refs, context, floatingStyles } = useFloating({
        open,
        onOpenChange: setOpen,
        middleware: [offset({ mainAxis: 32, crossAxis: 32 }), shift()],
        placement: 'right-end',
    });
    const hover = useHover(context);
    const { getReferenceProps, getFloatingProps } = useInteractions([hover]);
    return (
        <>
            <Wrapper ref={refs.setReference} {...getReferenceProps()}>
                {children}
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
