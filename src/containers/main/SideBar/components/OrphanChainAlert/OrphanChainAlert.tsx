import { Typography } from '@app/components/elements/Typography';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { autoUpdate, safePolygon, useFloating, useHover, useInteractions } from '@floating-ui/react';
import { TooltipTrigger, AlertWrapper, AlertIcon, TooltipWrapper, TooltipTop } from './OrphanChainAlert.styles.ts';
import { AnimatePresence } from 'framer-motion';
import { List } from '@app/components/elements/List.tsx';

import tinkerEmoji from '@app/assets/icons/emoji/custom.png';

const steps = [
    `Check your Internet connection`,
    `Wait 30 mins`,
    `Restart the app`,
    `Try using a Tor Bridge (in Settings)`,
    `Try disabling Tor (in Settings)`,
    `Try an app reset (in Settings)`,
];

export const OrphanChainAlert = () => {
    const [isOrphanChain, setIsOrphanChain] = useState(false);
    const [open, setOpen] = useState(false);
    const { t } = useTranslation('settings', { useSuspense: false });
    const { refs, context } = useFloating({
        open: open,
        onOpenChange: setOpen,

        whileElementsMounted(referenceEl, floatingEl, update) {
            return autoUpdate(referenceEl, floatingEl, update, {
                layoutShift: false,
            });
        },
    });

    const hover = useHover(context, {
        move: !open,
        handleClose: safePolygon(),
    });
    const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

    useEffect(() => {
        const unlistenPromise = listen<boolean>('is_stuck', (event) => {
            setIsOrphanChain(event.payload);
        });
        return () => {
            unlistenPromise.then((unlisten) => unlisten());
        };
    }, [setIsOrphanChain]);

    const alertMarkup = (
        <AlertWrapper>
            <TooltipTrigger ref={refs.setReference} {...getReferenceProps()}>
                <AlertIcon size={14} />
                <Typography>{t('is-on-orphan-chain')}</Typography>
            </TooltipTrigger>
            <AnimatePresence>
                {open && (
                    <TooltipWrapper ref={refs.setFloating} {...getFloatingProps()}>
                        <TooltipTop>
                            <img src={tinkerEmoji} alt="" />
                            <Typography variant="h6">{`Things to try:`}</Typography>
                        </TooltipTop>
                        <List items={steps} />
                    </TooltipWrapper>
                )}
            </AnimatePresence>
        </AlertWrapper>
    );

    return isOrphanChain ? alertMarkup : null;
};

export default OrphanChainAlert;
