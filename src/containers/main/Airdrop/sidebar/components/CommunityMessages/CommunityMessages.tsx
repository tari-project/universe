import { useAirdropStore, useUIStore } from '@app/store';
import { CloseButton, Message } from './CommunityMessages.styles';
import { AnimatePresence } from 'motion/react';
import CloseIcon from '@app/components/GreenModal/icons/CloseIcon';
import { useCallback, useEffect, useMemo, useState } from 'react';

export const CommunityMessages = () => {
    const sidebarOpen = useUIStore((s) => s.sidebarOpen);
    const [dismissedMessages, setDismissedMessages] = useState<string[]>([]);
    const { communityMessages } = useAirdropStore();

    const handleCloseMessage = useCallback(
        (id: string) => {
            try {
                if (dismissedMessages.length > 5) {
                    setDismissedMessages((prev) => prev.slice(1));
                }
                const newHiddenMessages = [...dismissedMessages, id];
                localStorage.setItem('dismissedCommunityMessages', JSON.stringify(newHiddenMessages));
                setDismissedMessages(newHiddenMessages);
            } catch (e) {
                console.error(e);
            }
        },
        [dismissedMessages]
    );

    useEffect(() => {
        try {
            const hiddenMessages = localStorage.getItem('dismissedCommunityMessages');
            if (hiddenMessages) {
                setDismissedMessages(JSON.parse(hiddenMessages));
            }
        } catch (e) {
            console.error(e);
        }
    }, []);

    const activeMessage = useMemo(() => {
        return communityMessages?.find((message) => !dismissedMessages.includes(message.id));
    }, [communityMessages, dismissedMessages]);

    return (
        <AnimatePresence mode="wait">
            {activeMessage ? (
                <Message
                    key={activeMessage.id}
                    $isSidebarOpen={sidebarOpen}
                    $type={activeMessage.type}
                    whileHover={{ boxShadow: '0 0 0 1px #fff' }}
                    initial={{
                        scale: 0.5,
                        opacity: 0,
                    }}
                    animate={{
                        scale: 1,
                        opacity: 1,
                    }}
                    exit={{
                        scale: 0.5,
                        opacity: 0,
                    }}
                >
                    <div dangerouslySetInnerHTML={{ __html: activeMessage.textHtml }} />
                    <CloseButton onClick={() => handleCloseMessage(activeMessage.id)}>
                        <CloseIcon />
                    </CloseButton>
                </Message>
            ) : null}
        </AnimatePresence>
    );
};
