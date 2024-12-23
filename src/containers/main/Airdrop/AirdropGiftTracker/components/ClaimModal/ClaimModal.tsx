import {
    ActionWrapper,
    ClaimButton,
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
    TextWrapper,
    Title,
} from './styles';
import gemImage from './images/gems.png';
import gemLargeImage from './images/gem-large.png';
import { useCallback, useState } from 'react';
import { GIFT_GEMS, MAX_GEMS, useAirdropStore } from '@app/store/useAirdropStore';
import { Trans, useTranslation } from 'react-i18next';
import { GemImage } from '../Gems/styles';
import { useAppConfigStore } from '@app/store/useAppConfigStore';
import GreenModal from '@app/components/GreenModal/GreenModal';

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

    const handleSubmit = useCallback(
        async (e: React.MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();
            e.stopPropagation();
            await setAllowTelemetry(true);
            return onSubmit(claimCode);
        },
        [claimCode, onSubmit, setAllowTelemetry]
    );

    return (
        <GreenModal onClose={onClose}>
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
                            gems1: (referralQuestPoints?.pointsForClaimingReferral || GIFT_GEMS).toLocaleString(),
                            gems2: MAX_GEMS.toLocaleString(),
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

                <ClaimButton onClick={handleSubmit}>{t('claimGems')}</ClaimButton>

                {!allowTelemetry && (
                    <FinePrint>
                        <Trans t={t} i18nKey="claimModalFinePrint" ns="airdrop" components={{ bold: <strong /> }} />
                    </FinePrint>
                )}
            </ActionWrapper>
        </GreenModal>
    );
}
