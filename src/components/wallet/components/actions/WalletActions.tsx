import { ActionButton, Wrapper } from './styles.ts';
import { AnimatePresence } from 'motion/react';
import { CopySVG } from '@app/assets/icons/copy.tsx';
import { MenuDotsSVG } from '@app/assets/icons/menu-dots.tsx';
export default function WalletActions() {
    return (
        <AnimatePresence>
            <Wrapper>
                <ActionButton>
                    <CopySVG />
                </ActionButton>
                <ActionButton>
                    <MenuDotsSVG />
                </ActionButton>
            </Wrapper>
        </AnimatePresence>
    );
}
