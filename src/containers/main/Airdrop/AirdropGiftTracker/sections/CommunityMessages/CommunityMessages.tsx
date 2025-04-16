import { useAirdropStore } from '@app/store';
import { CloseButton, Message } from './styles';
import { AnimatePresence } from 'motion/react';
import CloseIcon from '@app/components/GreenModal/icons/CloseIcon';
import { useCallback, useEffect, useMemo, useState } from 'react';

export const CommunityMessages = () => {
    const [dismissedMessages, setDismissedMessages] = useState<string[]>([]);
    const { communityMessages } = useAirdropStore();

    const handleCloseMessage = useCallback(
        (id: string) => {
            if (dismissedMessages.length > 5) {
                setDismissedMessages((prev) => prev.slice(1));
            }
            const newHiddenMessages = [...dismissedMessages, id];
            localStorage.setItem('dismissedCommunityMessages', JSON.stringify(newHiddenMessages));
            setDismissedMessages(newHiddenMessages);
        },
        [dismissedMessages]
    );

    useEffect(() => {
        const hiddenMessages = localStorage.getItem('dismissedCommunityMessages');
        if (hiddenMessages) {
            setDismissedMessages(JSON.parse(hiddenMessages));
        }
    }, []);

    const activeMessage = useMemo(() => {
        return communityMessages?.find((message) => !dismissedMessages.includes(message.id));
    }, [communityMessages, dismissedMessages]);

    return (
        <AnimatePresence mode="wait">
            {activeMessage ? (
                <Message
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
                    key={activeMessage.id}
                    $type={activeMessage.type}
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
