import { useAirdropStore } from '@app/store';
import { CloseButton, Message } from './styles';
import { AnimatePresence } from 'motion/react';
import CloseIcon from '@app/components/GreenModal/icons/CloseIcon';
import { useEffect, useMemo, useState } from 'react';

export const CommunityMessages = () => {
    const [hiddenMessages, setHiddenMessages] = useState<string[]>([]);
    const { communityMessages } = useAirdropStore();
    const handleCloseMessage = (id: string) => {
        setHiddenMessages((prev) => {
            if (prev.length > 5) {
                setHiddenMessages((prev) => prev.slice(1));
            }
            localStorage.setItem('hiddenCommunityMessages', JSON.stringify(prev));
            return [...prev, id];
        });
    };

    useEffect(() => {
        const hiddenMessages = localStorage.getItem('hiddenCommunityMessages') || '';
        if (hiddenMessages) {
            setHiddenMessages(JSON.parse(hiddenMessages));
        }
    }, []);

    const activeMessage = useMemo(() => {
        return communityMessages?.find((message) => !hiddenMessages.includes(message.id));
    }, [communityMessages, hiddenMessages]);

    return (
        <AnimatePresence mode="wait">
            {activeMessage ? (
                <Message
                    initial={{
                        scale: 0,
                        opacity: 0,
                    }}
                    animate={{
                        scale: 1,
                        opacity: 1,
                    }}
                    exit={{
                        scale: 0,
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
