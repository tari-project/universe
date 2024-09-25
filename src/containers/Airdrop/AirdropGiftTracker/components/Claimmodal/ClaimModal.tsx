import {
    BoxWrapper,
    ClaimButton,
    Cover,
    FormWrapper,
    Gem1,
    Gem2,
    Gem3,
    GemsWrapper,
    InputGems,
    InputLabel,
    InputWrapper,
    StyledInput,
    Text,
    TextButton,
    TextWrapper,
    Title,
    Wrapper,
    XLogo,
} from './styles';
import gemImage from './images/gems.png';
import gemLargeImage from './images/gem-large.png';
import { useCallback, useState } from 'react';
import { GIFT_GEMS } from '@app/store/useAirdropStore';
import { GemImage } from '../Gems/styles';
import XLogoIcon from './icons/XLogoIcon';

interface ClaimModalProps {
    onSubmit: (code?: string) => void;
    onClose: () => void;
}

export default function ClaimModal({ onSubmit, onClose }: ClaimModalProps) {
    //const { t } = useTranslation(['airdrop'], { useSuspense: false });

    const [claimCode, setClaimCode] = useState('');

    const handleSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            return onSubmit(claimCode);
        },
        [claimCode, onSubmit]
    );

    return (
        <Wrapper>
            <BoxWrapper initial={{ opacity: 0, y: '100px' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <GemsWrapper>
                    <Gem1 src={gemLargeImage} alt="" />
                    <Gem2 src={gemLargeImage} alt="" />
                    <Gem3 src={gemLargeImage} alt="" />
                </GemsWrapper>

                <TextWrapper>
                    <Title>Earn rewards for Mining on Testnet</Title>
                    <Text>
                        Earn gems by mining and referring friends to increase your airdrop reward during testnet! Have a
                        referral code? Enter it below and earn an additional{' '}
                        <strong>{GIFT_GEMS.toLocaleString()}</strong> gems for you and your friend!
                    </Text>
                </TextWrapper>

                <FormWrapper onSubmit={handleSubmit}>
                    <InputWrapper>
                        <InputLabel>Optional</InputLabel>
                        <StyledInput
                            type="text"
                            placeholder="Enter referral code"
                            onChange={(e) => setClaimCode(e.target.value)}
                            value={claimCode}
                        />
                        <InputGems>
                            {GIFT_GEMS.toLocaleString()} <GemImage src={gemImage} alt="" />
                        </InputGems>
                    </InputWrapper>

                    <ClaimButton type="submit">
                        Claim gems{' '}
                        <XLogo>
                            <XLogoIcon />
                        </XLogo>
                    </ClaimButton>
                </FormWrapper>

                <TextButton onClick={onClose}>{`I'll do this later`}</TextButton>
            </BoxWrapper>

            <Cover onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
        </Wrapper>
    );
}
