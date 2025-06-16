import { useState } from 'react';
import { offset, safePolygon, useFloating, useHover, useInteractions } from '@floating-ui/react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'motion/react';
import { CopySVG } from '@app/assets/icons/copy.tsx';
import { useCopyToClipboard } from '@app/hooks';
import { useWalletStore } from '@app/store';
import { truncateMiddle } from '@app/utils';
import { ActionButton, AddressTooltip, Wrapper } from './styles.ts';
import { setShowUniversalModal } from '@app/store/useExchangeStore.ts';
import { Menu } from '@app/containers/navigation/components/Wallet/SyncTooltip/styles.ts';
import { MenuDotsSVG } from '@app/assets/icons/menu-dots.tsx';

function ActionAddress() {
    const { t } = useTranslation('wallet');

    const [showAdress, setShowAddress] = useState(false);
    const { copyToClipboard, isCopied } = useCopyToClipboard();
    const [walletAddress, _walletAddressEmoji] = useWalletStore((state) => state.getActiveTariAddress());
    const displayAddress = truncateMiddle(walletAddress, 5);

    const { refs, context, floatingStyles } = useFloating({
        open: showAdress,
        onOpenChange: setShowAddress,
        placement: 'right-start',
        strategy: 'fixed',
        middleware: [offset({ mainAxis: 10 })],
    });

    function handleCopyClick() {
        copyToClipboard(walletAddress);
    }

    const hover = useHover(context, {
        enabled: !!walletAddress,
        move: !showAdress,
        handleClose: safePolygon(),
    });
    const { getFloatingProps } = useInteractions([hover]);

    return (
        <>
            <AnimatePresence>
                {showAdress && (
                    <AddressTooltip
                        ref={refs.setFloating}
                        {...getFloatingProps()}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={floatingStyles}
                    >
                        {!isCopied ? displayAddress : t('receive.copy-address-success')}
                    </AddressTooltip>
                )}
            </AnimatePresence>
            <ActionButton ref={refs.setReference} onClick={handleCopyClick} disabled={!walletAddress}>
                <CopySVG />
            </ActionButton>
        </>
    );
}
function ActionMenu() {
    const [open, setOpen] = useState(false);
    const { refs, context, floatingStyles } = useFloating({
        open,
        onOpenChange: setOpen,
        placement: 'right',
        strategy: 'fixed',
        middleware: [offset({ mainAxis: 10 })],
    });

    function handleClick() {
        setShowUniversalModal(true);
    }

    const hover = useHover(context, {
        move: !open,
        handleClose: safePolygon(),
    });
    const { getFloatingProps } = useInteractions([hover]);

    return (
        <>
            <AnimatePresence>
                {open && (
                    <Menu
                        ref={refs.setFloating}
                        {...getFloatingProps()}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={floatingStyles}
                    >
                        <button onClick={handleClick}>{`Mine to an Exchange`}</button>
                    </Menu>
                )}
            </AnimatePresence>
            <ActionButton ref={refs.setReference}>
                <MenuDotsSVG />
            </ActionButton>
        </>
    );
}

export default function WalletCardActions() {
    return (
        <Wrapper>
            <ActionAddress />
            <ActionMenu />
        </Wrapper>
    );
}
