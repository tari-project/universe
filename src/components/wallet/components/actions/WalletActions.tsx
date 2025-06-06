import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'motion/react';

import { Wrapper, NavWrapper, NavButton } from './styles.ts';

interface WalletActionsProps {
    section: string;
    setSection: (section: string) => void;
}
export default function WalletActions({ section, setSection }: WalletActionsProps) {
    const { t } = useTranslation(['wallet', 'sidebar']);

    return (
        <AnimatePresence>
            <Wrapper>
                <NavWrapper>
                    <NavButton
                        $isActive={section === 'send'}
                        aria-selected={section === 'send'}
                        onClick={() => setSection('send')}
                    >
                        {t('tabs.send')}
                    </NavButton>
                    <NavButton
                        $isActive={section === 'receive'}
                        aria-selected={section === 'receive'}
                        onClick={() => setSection('receive')}
                    >
                        {t('tabs.receive')}
                    </NavButton>
                </NavWrapper>
            </Wrapper>
        </AnimatePresence>
    );
}
