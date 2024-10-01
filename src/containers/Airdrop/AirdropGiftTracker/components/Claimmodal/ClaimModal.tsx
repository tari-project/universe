import {
    ActionWrapper,
    BoxWrapper,
    ClaimButton,
    CloseButton,
    Cover,
    FinePrint,
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
import { GIFT_GEMS, useAirdropStore } from '@app/store/useAirdropStore';
import { Trans, useTranslation } from 'react-i18next';
import { GemImage } from '../Gems/styles';
import XLogoIcon from './icons/XLogoIcon';
import { useAppConfigStore } from '@app/store/useAppConfigStore';
import CloseIcon from './icons/CloseIcon';

interface ClaimModalProps {
    onSubmit: (code?: string) => void;
    onClose: () => void;
}

export default function ClaimModal({ onSubmit, onClose }: ClaimModalProps) {
    const referralQuestPoints = useAirdropStore((state) => state.referralQuestPoints);
    const { t } = useTranslation(['airdrop'], { useSuspense: false });
    const allowTelemetry = useAppConfigStore((s) => s.allow_telemetry);
    const setAllowTelemetry = useAppConfigStore((s) => s.setAllowTelemetry);

    const [claimCode, setClaimCode] = useState('');

    const handleSubmit = useCallback(async () => {
        await setAllowTelemetry(true);
        return onSubmit(claimCode);
    }, [claimCode, onSubmit, setAllowTelemetry]);

    return (
        <Wrapper>
            <BoxWrapper initial={{ opacity: 0, y: '100px' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <CloseButton onClick={onClose}>
                    <CloseIcon />
                </CloseButton>

                <GemsWrapper>
                    <Gem1 src={gemLargeImage} alt="" />
                    <Gem2 src={gemLargeImage} alt="" />
                    <Gem3 src={gemLargeImage} alt="" />
                </GemsWrapper>

                <TextWrapper>
                    <Title>{t('claimModalTitle')}</Title>

                    <Text
                        dangerouslySetInnerHTML={{
                            __html: t('claimModalText', {
                                gems: (referralQuestPoints?.pointsForClaimingReferral || GIFT_GEMS).toLocaleString(),
                            }),
                        }}
                    />
                </TextWrapper>

                <ActionWrapper>
                    <InputWrapper>
                        <InputLabel>{t('claimModalFieldLabel')}</InputLabel>
                        <StyledInput
                            type="text"
                            placeholder={t('claimModalFieldPlaceholder')}
                            onChange={(e) => setClaimCode(e.target.value)}
                            value={claimCode}
                        />
                        <InputGems>
                            {GIFT_GEMS.toLocaleString()} <GemImage src={gemImage} alt="" />
                        </InputGems>
                    </InputWrapper>

                    <ClaimButton onClick={handleSubmit}>
                        {t('claimGems')}
                        <XLogo>
                            <XLogoIcon />
                        </XLogo>
                    </ClaimButton>

                    {!allowTelemetry && (
                        <FinePrint>
                            <Trans t={t} i18nKey="claimModalFinePrint" ns="airdrop" components={{ bold: <strong /> }} />
                        </FinePrint>
                    )}
                </ActionWrapper>
            </BoxWrapper>

            <Cover onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
        </Wrapper>
    );
}
