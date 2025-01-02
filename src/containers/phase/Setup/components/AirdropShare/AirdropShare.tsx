import { GemsWrapper, Text, Title } from '../AirdropLogin/styles';
import { Avatar, Copied, CopyButton, CopyText, CopyWrapper, Gem1, Gem2, Gem3, TextWrapper, Wrapper } from './styles';
import { useTranslation, Trans } from 'react-i18next';
import gemLargeImage from '../../../../main/Airdrop/AirdropGiftTracker/images/gem.png';
import { REFERRAL_GEMS, useAirdropStore } from '@app/store/useAirdropStore';
import { useEffect, useState } from 'react';
import { useAirdropSyncState } from '@app/hooks/airdrop/useAirdropSyncState';
import { AnimatePresence, m } from 'framer-motion';

export default function AirdropShare() {
    useAirdropSyncState();
    const airdropUrl = useAirdropStore((state) => state.backendInMemoryConfig?.airdropUrl || '');
    const { t } = useTranslation(['airdrop'], { useSuspense: false });
    const { userDetails, referralQuestPoints } = useAirdropStore();

    const profileimageurl = userDetails?.user?.profileimageurl;
    const gems = (referralQuestPoints?.pointsForClaimingReferral || REFERRAL_GEMS).toLocaleString();

    const referralCode = userDetails?.user?.referral_code || '';

    const [copied, setCopied] = useState(false);

    const url = `${airdropUrl}/download/${referralCode}`;

    const handleCopy = () => {
        setCopied(true);
        navigator.clipboard.writeText(url);
    };

    useEffect(() => {
        if (copied) {
            const timeout = setTimeout(() => {
                setCopied(false);
            }, 2000);
            return () => {
                clearTimeout(timeout);
            };
        }
    }, [copied]);

    if (!userDetails) return null;

    return (
        <Wrapper initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
            <GemsWrapper>
                <Gem1 src={gemLargeImage} alt="" />
                <Gem2 src={gemLargeImage} alt="" />
                <Gem3 src={gemLargeImage} alt="" />

                <Avatar $image={profileimageurl || ''} />
            </GemsWrapper>

            <TextWrapper>
                <Title>
                    <Trans
                        t={t}
                        i18nKey="setupInviteTitle"
                        ns="airdrop"
                        components={{ span: <span /> }}
                        values={{ gems }}
                    />
                </Title>
                <Text>{t('setupLoginText')}</Text>
            </TextWrapper>

            <CopyWrapper onClick={handleCopy} $copied={copied}>
                <AnimatePresence>
                    {copied && (
                        <Copied initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <m.span initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ opacity: 0 }}>
                                {t('linkCopied')}
                            </m.span>
                        </Copied>
                    )}
                </AnimatePresence>
                <CopyText>{url}</CopyText>
                <CopyButton>{t('setupCopyButton')}</CopyButton>
            </CopyWrapper>
        </Wrapper>
    );
}
