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
import { AnimatePresence } from 'framer-motion';
import { useAirdropStore } from '@app/store/useAirdropStore';

interface DownloadReferralModalProps {
    referralCode: string;
    onClose: () => void;
}

export default function DownloadReferralModal({ referralCode, onClose }: DownloadReferralModalProps) {
    const airdropUrl = useAirdropStore((state) => state.backendInMemoryConfig?.airdropUrl || '');
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

    return (
        <Wrapper>
            <BoxWrapper initial={{ opacity: 0, y: '100px' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <GemsWrapper>
                    <Gem1 src={gemLargeImage} alt="" />
                    <Gem2 src={gemLargeImage} alt="" />
                    <Gem3 src={gemLargeImage} alt="" />
                </GemsWrapper>

                <TextWrapper>
                    <Title>
                        Invite Friends, earn{' '}
                        <span>
                            1000 <GemTextImage src={gemImage} alt="" />
                        </span>{' '}
                        gems
                    </Title>
                    <Text>
                        Earn 1000 gems for each friend you invite to Tari Universe. Once they connect their account,
                        you’ll be awarded your gems.
                    </Text>
                </TextWrapper>

                <ShareWrapper>
                    <ShareText>{url.replace('https://', '')}</ShareText>
                    <CopyButton onClick={handleCopy}>
                        <AnimatePresence mode="wait">
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
                        </AnimatePresence>
                    </CopyButton>
                </ShareWrapper>
            </BoxWrapper>

            <Cover onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
        </Wrapper>
    );
}
