import { Wrapper, CopyButtton, GrowButton, Copied } from './styles';

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function GrowCrew() {
    const { t } = useTranslation('sos', { useSuspense: false });
    const [copied, setCopied] = useState(false);

    const shareLink = 'https://universe.tari.com';

    const handleCopy = () => {
        navigator.clipboard.writeText(shareLink).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <Wrapper>
            <CopyButtton onClick={handleCopy}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="0.75" y="3.75" width="9" height="9" stroke="currentColor" />
                    <rect x="0.75" y="3.75" width="9" height="9" stroke="currentColor" />
                    <path d="M3.75 3.75V0.75H12.75V9.75H10.25" stroke="currentColor" />
                </svg>
                <AnimatePresence>
                    {copied && (
                        <Copied
                            initial={{ opacity: 0, y: 10, x: '-50%' }}
                            animate={{ opacity: 1, y: 0, x: '-50%' }}
                            exit={{ opacity: 0, x: '-50%' }}
                        >
                            {t('widget.friends.linkCopied')}
                        </Copied>
                    )}
                </AnimatePresence>
            </CopyButtton>
            <GrowButton>{t('widget.friends.growCrew')}</GrowButton>
        </Wrapper>
    );
}
