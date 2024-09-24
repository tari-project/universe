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

export default function Invite() {
    const airdropUrl = useAirdropStore((state) => state.backendInMemoryConfig?.airdropUrl || '');
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
                                Link copied!
                            </m.span>
                        </Copied>
                    )}
                </AnimatePresence>

                <Image src={giftImage} alt="" />

                <TextWrapper>
                    <Title>Invite Friends</Title>
                    <Text>
                        You’ve invited <span>{referralCount?.count || 0}</span> friends
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
                        Invite&nbsp;<strong>{friendsRemaining} friends</strong>&nbsp;& earn{' '}
                        {nextBonusTier?.bonusGems.toLocaleString()} bonus gems
                    </BonusText>
                    <Image src={boxImage} alt="" className="giftImage" />
                </BonusWrapper>
            )}
        </Wrapper>
    );
}
