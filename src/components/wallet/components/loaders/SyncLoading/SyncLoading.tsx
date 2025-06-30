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

const date = new Date(Date.now() + (2 * 60 * 60 + 17 * 60) * 1000);

export default function SyncLoading() {
    const sync_text = {
        line1: 'Sync in progress. ',
        line2: ' remaining',
        line3: 'until your wallet balance is displayed',
        tooltipTitle: 'Why the delay?',
        tooltipDescription:
            "Your node is still syncing, so your balance isn't visible yet. But don't worry, you're actively mining and earning XTM.",
    };

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
                        {sync_text.line1}
                        <strong>
                            <Countdown
                                date={date}
                                renderer={({ hours, minutes, completed }) =>
                                    completed ? 'any moment now' : `${hours}h ${minutes.toString().padStart(2, '0')}m`
                                }
                            />
                            {sync_text.line2}
                        </strong>
                    </Line>
                    <Line>{sync_text.line3}</Line>
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
                                <TooltipTitle>{sync_text.tooltipTitle}</TooltipTitle>
                                <TooltipDescription>{sync_text.tooltipDescription}</TooltipDescription>
                            </TooltipContent>
                        </TooltipPosition>
                    </FloatingPortal>
                )}
            </AnimatePresence>
        </>
    );
}
