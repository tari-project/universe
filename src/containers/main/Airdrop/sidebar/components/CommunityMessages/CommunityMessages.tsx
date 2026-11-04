import { useAirdropStore, useUIStore } from '@app/store';
import { CloseButton, Message } from './CommunityMessages.styles';
import { AnimatePresence } from 'motion/react';
import CloseIcon from '@app/components/GreenModal/icons/CloseIcon';
import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react';
import DOMPurify from 'dompurify';
import { useTranslation } from 'react-i18next';
import { open } from '@tauri-apps/plugin-shell';
import { isAllowedExternalUrl } from '@app/utils/externalUrl';

export const CommunityMessages = () => {
    const { t } = useTranslation('common', { useSuspense: false });
    const sidebarOpen = useUIStore((s) => s.sidebarOpen);
    const [dismissedMessages, setDismissedMessages] = useState<string[]>([]);
    const communityMessages = useAirdropStore((s) => s.communityMessages);

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

    // textHtml comes from the remote airdrop API, so it's untrusted. Sanitize it before it
    // reaches dangerouslySetInnerHTML: a compromised or spoofed response must not be able to
    // run script inside the app webview (where it would reach the Tauri IPC bridge).
    const safeHtml = useMemo(() => {
        if (!activeMessage) return '';
        const template = document.createElement('template');
        template.innerHTML = DOMPurify.sanitize(activeMessage.textHtml);
        // Community links must leave the app webview even when the remote
        // message omits target or supplies a different value.
        template.content.querySelectorAll('a[href]').forEach((link) => {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        });
        return template.innerHTML;
    }, [activeMessage]);

    const handleLinkClick = useCallback((event: MouseEvent<HTMLDivElement>) => {
        const target = event.target;
        if (!(target instanceof Element)) return;
        const link = target.closest('a[href]');
        if (!link || !event.currentTarget.contains(link)) return;
        event.preventDefault();
        const url = link.getAttribute('href');
        if (!isAllowedExternalUrl(url)) return;
        open(url).catch((e) => console.error('Could not open community link', e));
    }, []);

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
                    <div onClick={handleLinkClick} dangerouslySetInnerHTML={{ __html: safeHtml }} />
                    <CloseButton aria-label={t('close')} onClick={() => handleCloseMessage(activeMessage.id)}>
                        <CloseIcon />
                    </CloseButton>
                </Message>
            ) : null}
        </AnimatePresence>
    );
};
