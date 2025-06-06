import { ActionButton, AddressTooltip, Menu, Wrapper } from './styles.ts';
import { AnimatePresence } from 'motion/react';
import { CopySVG } from '@app/assets/icons/copy.tsx';
import { MenuDotsSVG } from '@app/assets/icons/menu-dots.tsx';
import { useCopyToClipboard } from '@app/hooks';
import { useWalletStore } from '@app/store';
import { truncateMiddle } from '@app/utils';
import { useState } from 'react';
import { offset, safePolygon, useFloating, useHover, useInteractions } from '@floating-ui/react';
import { useTranslation } from 'react-i18next';
import { setShowUniversalModal } from '@app/store/useExchangeStore.ts';

function ActionAddress() {
    const { t } = useTranslation('wallet');

    const [showAdress, setShowAddress] = useState(false);
    const { copyToClipboard, isCopied } = useCopyToClipboard();
    const address = useWalletStore((state) => state.tari_address_base58);
    const displayAddress = truncateMiddle(address, 5);

    const { refs, context, floatingStyles } = useFloating({
        open: showAdress,
        onOpenChange: setShowAddress,
        placement: 'right-start',
        strategy: 'fixed',
        middleware: [offset({ mainAxis: 10 })],
    });

    function handleCopyClick() {
        copyToClipboard(address);
    }

    const hover = useHover(context, {
        enabled: !!address,
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
            <ActionButton ref={refs.setReference} onClick={handleCopyClick} disabled={!address}>
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
