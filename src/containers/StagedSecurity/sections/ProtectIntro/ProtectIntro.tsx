import { useWalletStore } from '@app/store/useWalletStore';
import { StagedSecuritySectionType } from '../../StagedSecurityModal';
import { BlackButton, Text, Title } from '../../styles';
import { WalletText, Warning, Wrapper } from './styles';
import formatBalance from '@app/utils/formatBalance';
import { Trans, useTranslation } from 'react-i18next';

interface Props {
    setSection: (section: StagedSecuritySectionType) => void;
}

export default function ProtectIntro({ setSection }: Props) {
    const { t } = useTranslation(['staged-security'], { useSuspense: false });

    const balance = useWalletStore((state) => state.balance);
    const formatted = formatBalance(balance || 0);

    const handleButtonClick = () => {
        setSection('SeedPhrase');
    };

    return (
        <Wrapper>
            <Warning>{t('intro.warning')}</Warning>

            <Title>{t('intro.title')}</Title>

            <Text>{t('intro.text')}</Text>

            <WalletText>
                <Trans
                    i18nKey="staged-security:intro.balance"
                    components={{
                        span: <span />,
                    }}
                    values={{ balance: formatted }}
                />
            </WalletText>

            <BlackButton onClick={handleButtonClick}>
                <span>{t('intro.button')}</span>
            </BlackButton>
        </Wrapper>
    );
}
