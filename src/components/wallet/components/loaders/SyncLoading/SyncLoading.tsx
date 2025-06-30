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
import { useState } from 'react';
import { useFloating, useHover, useInteractions, offset, shift, FloatingPortal } from '@floating-ui/react';
import { AnimatePresence } from 'motion/react';
import Countdown from 'react-countdown';
import { useTranslation } from 'react-i18next';

const date = new Date(Date.now() + (2 * 60 * 60 + 17 * 60) * 1000);

export default function SyncLoading() {
    const { t } = useTranslation('wallet');
    const [open, setOpen] = useState(false);

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
                <Text>
                    <Line>
                        {t('sync-message.line1')}
                        <strong>
                            <Countdown
                                date={date}
                                renderer={({ hours, minutes, completed }) =>
                                    completed
                                        ? t('sync-message.completed')
                                        : `${hours}h ${minutes.toString().padStart(2, '0')}m`
                                }
                            />
                            {t('sync-message.line2')}
                        </strong>
                    </Line>
                    <Line>{t('sync-message.line3')}</Line>
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
                                <TooltipDescription>{t('sync-message.tooltip-description')}</TooltipDescription>
                            </TooltipContent>
                        </TooltipPosition>
                    </FloatingPortal>
                )}
            </AnimatePresence>
        </>
    );
}
