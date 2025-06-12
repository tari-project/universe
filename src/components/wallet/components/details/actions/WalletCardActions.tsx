import { useState } from 'react';
import { offset, safePolygon, useFloating, useHover, useInteractions } from '@floating-ui/react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'motion/react';
import { CopySVG } from '@app/assets/icons/copy.tsx';
import { useCopyToClipboard } from '@app/hooks';
import { useWalletStore } from '@app/store';
import { truncateMiddle } from '@app/utils';
import { ActionButton, AddressTooltip, Wrapper } from './styles.ts';

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
export default function WalletCardActions() {
    return (
        <Wrapper>
            <ActionAddress />
        </Wrapper>
    );
}
