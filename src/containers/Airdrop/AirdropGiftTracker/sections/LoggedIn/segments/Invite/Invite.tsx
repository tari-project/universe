import {
    Wrapper,
    InviteButton,
    Image,
    TextWrapper,
    Title,
    Text,
    GemPill,
    BonusWrapper,
    BonusText,
    Copied,
} from './styles';
import giftImage from '../../../../images/gift.png';
import gemImage from '../../../../images/gem.png';
import boxImage from '../../../../images/gold_box.png';
import { useAirdropStore } from '@app/store/useAirdropStore';
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { Trans, useTranslation } from 'react-i18next';

export default function Invite() {
    const airdropUrl = useAirdropStore((state) => state.backendInMemoryConfig?.airdropUrl || '');
    const { t } = useTranslation(['airdrop'], { useSuspense: false });
    const { userDetails, referralCount, bonusTiers } = useAirdropStore();

    const referralCode = userDetails?.user?.referral_code || '';

    const [copied, setCopied] = useState(false);

    const url = `${airdropUrl}/download/${referralCode}`;

    const nextBonusTier = useMemo(
        () => bonusTiers?.sort((a, b) => a.target - b.target).find((t) => t.target > (referralCount?.count || 0)),
        [bonusTiers, referralCount?.count]
    );
    const friendsRemaining = nextBonusTier?.target && (nextBonusTier.target - (referralCount?.count || 0) || 0);

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

    return (
        <Wrapper>
            <InviteButton onClick={handleCopy} disabled={copied}>
                <AnimatePresence>
                    {copied && (
                        <Copied initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <m.span initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ opacity: 0 }}>
                                {t('linkCopied')}
                            </m.span>
                        </Copied>
                    )}
                </AnimatePresence>

                <Image src={giftImage} alt="" />

                <TextWrapper>
                    <Title>{t('inviteFirends')}</Title>
                    <Text>
                        <Trans
                            ns="airdrop"
                            i18nKey="invitedAmount"
                            components={{ span: <span /> }}
                            values={{ count: referralCount?.count || 0 }}
                        />
                    </Text>
                </TextWrapper>

                <GemPill>
                    {referralCount?.gems.toLocaleString() || 0}
                    <Image src={gemImage} alt="" />
                </GemPill>
            </InviteButton>

            {nextBonusTier && (
                <BonusWrapper>
                    <BonusText>
                        <Trans
                            ns="airdrop"
                            i18nKey="nextTierBonus"
                            components={{ strong: <strong /> }}
                            values={{
                                count: ` ${friendsRemaining} `,
                                bonusGems: nextBonusTier?.bonusGems.toLocaleString(),
                            }}
                        />
                    </BonusText>
                    <Image src={boxImage} alt="" className="giftImage" />
                </BonusWrapper>
            )}
        </Wrapper>
    );
}
