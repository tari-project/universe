import { BoxWrapper, CopyButton, Overlay, ShareCode, TextWrapper, Title, Text, GemImage } from './styles';
import gemImage from '../images/gems.png';
import { appConfig } from '@app/config';
import { useEffect, useState } from 'react';

const REFERRAL_QUERY_KEY = 'download-universe-referral-code';

interface DownloadReferralModalProps {
    referralCode: string;
    onClose: () => void;
}
export default function DownloadReferralModal({ referralCode, onClose }: DownloadReferralModalProps) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        setCopied(true);
        const url = `${appConfig.airdropBaseUrl}/download?${REFERRAL_QUERY_KEY}=${referralCode}`;
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
        <Overlay onClick={onClose}>
            <BoxWrapper
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <TextWrapper>
                    <Title>
                        Invite Friends, earn <span>200</span> <GemImage src={gemImage} alt="" /> gems
                    </Title>
                    <Text>
                        Earn 200 gems for each friend you invite to Tari Universe. Once they connect their account,
                        you’ll be awarded your gems.
                    </Text>
                </TextWrapper>
                <ShareCode>
                    <span>{referralCode}</span>
                    <CopyButton onClick={handleCopy} $copied={copied}>
                        {copied ? 'Copied' : 'Copy'}
                    </CopyButton>
                </ShareCode>
            </BoxWrapper>
        </Overlay>
    );
}
