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
import { useEffect, useState } from 'react';
import { useAirdropStore } from '@app/store/useAirdropStore';
import { Button } from '@app/components/elements/Button';
import { Input } from '@app/components/elements/inputs/Input';
import { useAridropRequest } from '@app/hooks/airdrop/stateHelpers/useGetAirdropUserDetails';

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
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');

    const handleRequest = useAridropRequest();

    const [claimCode, setClaimCode] = useState('');

    const handleReferral = async () => {
        await handleRequest<ClaimResponse>({
            path: `/miner/download/referral/${claimCode}`,
            method: 'POST',
            body: {},
        }).then((r) => {
            if (r?.success) {
                setError('');
                setClaimCode('');
                onClose();
            }
            if (r?.message) {
                setError(r.message);
            }
        });
    };

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

    const claimMarkup = (
        <>
            <TextWrapper>
                <Title>
                    Claim your referral code{' '}
                    <span>
                        2000 <GemTextImage src={gemImage} alt="" />
                    </span>{' '}
                    gems
                </Title>
                <Text>
                    Claim your referral code and earn 2000 gems. Once you connect your account, you’ll be awarded your
                    gems.
                </Text>
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
                    Invite Friends, earn{' '}
                    <span>
                        2000 <GemTextImage src={gemImage} alt="" />
                    </span>{' '}
                    gems
                </Title>
                <Text>
                    Earn 2000 gems for each friend you invite to Tari Universe. Once they connect their account, you’ll
                    be awarded your gems.
                </Text>
            </TextWrapper>
            <ShareWrapper>
                <ShareText>{url.replace('https://', '')}</ShareText>
                <CopyButton onClick={handleCopy}>
                    {copied ? (
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
