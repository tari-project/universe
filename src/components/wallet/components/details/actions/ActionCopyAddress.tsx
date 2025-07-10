import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'motion/react';
import { CopySVG } from '@app/assets/icons/copy';
import { useCopyToClipboard } from '@app/hooks';
import { useWalletStore } from '@app/store';
import { truncateMiddle } from '@app/utils';
import { offset, useFloating, useHover, useInteractions } from '@floating-ui/react';
import { AddressTooltip, ActionButton } from './styles.ts';

export default function ActionCopyAddress() {
    const { t } = useTranslation('wallet');
    const { copyToClipboard, isCopied } = useCopyToClipboard();
    const [showAdress, setShowAddress] = useState(false);
    const getActiveTariAddress = useWalletStore((state) => state.getActiveTariAddress);
    const [walletAddress, _walletAddressEmoji] = getActiveTariAddress();
    const displayAddress = truncateMiddle(walletAddress, 5);

    const { refs, context, floatingStyles } = useFloating({
        open: showAdress,
        onOpenChange: setShowAddress,
        placement: 'right',
        strategy: 'fixed',
        middleware: [offset({ mainAxis: 10 })],
    });

    function handleCopyClick() {
        copyToClipboard(walletAddress);
    }

    const hover = useHover(context, {
        enabled: !!walletAddress,
        move: !showAdress,
    });

    const { getFloatingProps } = useInteractions([hover]);

    return (
        <>
            <AnimatePresence>
                {showAdress && (
                    <div ref={refs.setFloating} {...getFloatingProps()} style={floatingStyles}>
                        <AddressTooltip
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                        >
                            {!isCopied ? displayAddress : t('receive.copy-address-success')}
                        </AddressTooltip>
                    </div>
                )}
            </AnimatePresence>
            <ActionButton ref={refs.setReference} onClick={handleCopyClick} disabled={!walletAddress}>
                <CopySVG />
            </ActionButton>
        </>
    );
}
