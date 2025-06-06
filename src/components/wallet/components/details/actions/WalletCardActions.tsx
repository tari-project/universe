import { ActionButton, AddressTooltip, Wrapper } from './styles.ts';
import { AnimatePresence } from 'motion/react';
import { CopySVG } from '@app/assets/icons/copy.tsx';
import { MenuDotsSVG } from '@app/assets/icons/menu-dots.tsx';
import { useCopyToClipboard } from '@app/hooks';
import { useWalletStore } from '@app/store';
import { truncateMiddle } from '@app/utils';
import { useState } from 'react';
import { offset, safePolygon, useFloating, useHover, useInteractions } from '@floating-ui/react';
import { useTranslation } from 'react-i18next';

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
            <ActionButton ref={refs.setReference} onClick={handleCopyClick}>
                <CopySVG />
            </ActionButton>
        </>
    );
}
export default function WalletCardActions() {
    return (
        <Wrapper>
            <ActionAddress />
            <ActionButton>
                <MenuDotsSVG />
            </ActionButton>
        </Wrapper>
    );
}
