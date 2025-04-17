import { Send } from './send/Send';
import { Receive } from './receive/Receive';
import Wallet from './wallet/Wallet';
import { SectionAnimation, WalletGreyBox, WalletSections } from './WalletSidebarContent.styles.ts';
import { memo, useState } from 'react';
import { AnimatePresence } from 'motion/react';

const sectionAnimation = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
};

const WalletSidebarContent = memo(function WalletSidebarContent() {
    const [section, setSection] = useState('history');
    return (
        <WalletSections>
            <WalletGreyBox>
                <AnimatePresence mode="popLayout">
                    {section === 'history' && (
                        <SectionAnimation key="history" {...sectionAnimation}>
                            <Wallet section={section} setSection={setSection} />
                        </SectionAnimation>
                    )}
                    {section === 'send' && (
                        <SectionAnimation key="send" {...sectionAnimation}>
                            <Send section={section} setSection={setSection} />
                        </SectionAnimation>
                    )}
                    {section === 'receive' && (
                        <SectionAnimation key="receive" {...sectionAnimation}>
                            <Receive section={section} setSection={setSection} />
                        </SectionAnimation>
                    )}
                </AnimatePresence>
            </WalletGreyBox>
        </WalletSections>
    );
});

export default WalletSidebarContent;
