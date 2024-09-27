import {
    BoxWrapper,
    CopyButton,
    CopyText,
    Cover,
    Gem1,
    Gem2,
    Gem3,
    GemsWrapper,
    GemTextImage,
    ShareText,
    ShareWrapper,
    Text,
    TextWrapper,
    Title,
    Wrapper,
} from './styles';
import gemImage from '../images/gems.png';
import gemLargeImage from './images/gem-large.png';
import { useState } from 'react';
import { useAirdropStore, GIFT_GEMS, REFERRAL_GEMS } from '@app/store/useAirdropStore';
import { Button } from '@app/components/elements/Button';
import { Input } from '@app/components/elements/inputs/Input';
import { useAridropRequest } from '@app/hooks/airdrop/stateHelpers/useGetAirdropUserDetails';
import { Trans, useTranslation } from 'react-i18next';
import { useCopyToClipboard } from '@app/hooks/helpers/useCopyToClipboard.ts';

interface DownloadReferralModalProps {
    referralCode?: string;
    onClose: () => void;
}

interface ClaimResponse {
    success: boolean;
    message: string;
    inviter?: string;
}

export default function DownloadReferralModal({ referralCode, onClose }: DownloadReferralModalProps) {
    const airdropUrl = useAirdropStore((state) => state.backendInMemoryConfig?.airdropUrl || '');
    const { t } = useTranslation(['airdrop'], { useSuspense: false });
    const [error, setError] = useState('');

    const { copyToClipboard, isCopied } = useCopyToClipboard();

    const handleRequest = useAridropRequest();

    const [claimCode, setClaimCode] = useState('');

    const handleReferral = async () => {
        await handleRequest<ClaimResponse>({
            path: `/miner/download/referral/${claimCode}`,
            method: 'POST',
            body: {},
        })
            .then((r) => {
                if (r?.success) {
                    setError('');
                    setClaimCode('');
                    onClose();
                }
                setError(r?.message || 'Something went wrong');
            })
            .catch((e) => {
                console.error(e);
                setError('Something went wrong');
            });
    };

    const url = `${airdropUrl}/download/${referralCode}`;
    const handleCopy = () => {
        copyToClipboard(url);
    };

    const claimMarkup = (
        <>
            <TextWrapper>
                <Title>
                    <Trans
                        ns="airdrop"
                        i18nKey="claimReferralCode"
                        components={{ span: <span />, image: <GemTextImage src={gemImage} alt="" /> }}
                        values={{ gems: GIFT_GEMS }}
                    />
                </Title>
                <Text>{t('claimReferralGifts', { gems: GIFT_GEMS })}</Text>
            </TextWrapper>
            <div>
                <ShareWrapper $isClaim>
                    <Input
                        type="text"
                        placeholder="Enter referral code"
                        onChange={(e) => setClaimCode(e.target.value)}
                        value={claimCode}
                    />
                    <Button color="primary" onClick={handleReferral}>
                        Claim
                    </Button>
                </ShareWrapper>
                {error && <Text $isError>{error}</Text>}
            </div>
        </>
    );

    const inviteMarkup = (
        <>
            <TextWrapper>
                <Title>
                    <Trans
                        ns="airdrop"
                        i18nKey="claimReferralCode"
                        components={{ span: <span />, image: <GemTextImage src={gemImage} alt="" /> }}
                        values={{ gems: REFERRAL_GEMS }}
                    />
                </Title>
                <Text>{t('giftReferralCode', { gems: REFERRAL_GEMS })}</Text>
            </TextWrapper>
            <ShareWrapper>
                <ShareText>{url.replace('https://', '')}</ShareText>
                <CopyButton onClick={handleCopy}>
                    {isCopied ? (
                        <CopyText
                            initial={{ opacity: 0, y: '100%' }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            key="copied"
                        >
                            Copied!
                        </CopyText>
                    ) : (
                        <CopyText
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            key="copy"
                            className="copytext"
                        >
                            Copy
                        </CopyText>
                    )}
                </CopyButton>
            </ShareWrapper>
        </>
    );

    return (
        <Wrapper>
            <BoxWrapper initial={{ opacity: 0, y: '100px' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <GemsWrapper>
                    <Gem1 src={gemLargeImage} alt="" />
                    <Gem2 src={gemLargeImage} alt="" />
                    <Gem3 src={gemLargeImage} alt="" />
                </GemsWrapper>

                {referralCode ? inviteMarkup : claimMarkup}
            </BoxWrapper>

            <Cover onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
        </Wrapper>
    );
}
