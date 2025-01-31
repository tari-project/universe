/* eslint-disable i18next/no-literal-string */
import { MenuWrapper, MenuContent, ToggleButton, Button } from './styles';
import { useFloating, offset, shift, flip, useClick, useInteractions, useDismiss } from '@floating-ui/react';
import { useState } from 'react';
import { ThemeGroup } from './groups/ThemeGroup';
import { DialogsGroup } from './groups/DialogsGroup';
import { GreenModalsGroup } from './groups/GreenModalsGroup';
import { ToastsGroup } from './groups/ToastsGroup';
import { OtherUIGroup } from './groups/OtherUIGroup';
import { AnimatePresence } from 'framer-motion';
import { handleNewBlock } from '@app/store/useBlockchainVisualisationStore';
import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore';
import { useWalletStore } from '@app/store/useWalletStore';

export default function AdminUI() {
    const [isOpen, setIsOpen] = useState(false);
    const block_height = useMiningMetricsStore((state) => state.base_node_status.block_height);
    const balance = useWalletStore((state) => state.balance);

    const mockWinningBlock = () => {
        setTimeout(() => {
            console.log(balance);
            const payload = {
                block_height: block_height + 1,
                coinbase_transaction: {
                    tx_id: 8651606433018935792,
                    status: 12,
                    amount: 13944001607,
                    timestamp: 1738320460,
                    mined_in_block_height: block_height + 1,
                },
                balance: {
                    available_balance: balance?.available_balance || 0,
                    timelocked_balance: balance?.timelocked_balance || 0,
                    pending_incoming_balance: (balance?.pending_incoming_balance || 0) + 13944001607,
                    pending_outgoing_balance: balance?.pending_outgoing_balance || 0,
                },
            };
            handleNewBlock(payload as any);
        }, 5000);
    };

    const { refs, floatingStyles, context } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
        middleware: [offset(10), flip(), shift()],
        placement: 'bottom-end',
    });

    const click = useClick(context);
    const dismiss = useDismiss(context);
    const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss]);

    return (
        <>
            <ToggleButton ref={refs.setReference} {...getReferenceProps()} $isOpen={isOpen}>
                Admin UI
            </ToggleButton>
            <AnimatePresence>
                {isOpen && (
                    <MenuWrapper ref={refs.setFloating} style={floatingStyles} {...getFloatingProps()}>
                        <MenuContent
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                        >
                            <Button onClick={mockWinningBlock}>Mock Winning Block</Button>
                            <ThemeGroup />
                            <DialogsGroup />
                            <GreenModalsGroup />
                            <ToastsGroup />
                            <OtherUIGroup />
                        </MenuContent>
                    </MenuWrapper>
                )}
            </AnimatePresence>
        </>
    );
}
