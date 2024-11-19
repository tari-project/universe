import { useWalletStore } from '@app/store/useWalletStore';
import { BlackButton, Text, Title } from '../../styles';
import { WalletText, Warning, Wrapper } from './styles';
import { Trans, useTranslation } from 'react-i18next';
import LoadingSvg from '@app/components/svgs/LoadingSvg';
import { formatNumber, FormatPreset } from '@app/utils/formatters';

interface Props {
    onButtonClick: () => void;
    isLoading: boolean;
}

export default function ProtectIntro({ onButtonClick, isLoading }: Props) {
    const { t } = useTranslation(['staged-security'], { useSuspense: false });

    const balance = useWalletStore((state) => state.balance);
    const formatted = formatNumber(balance || 0, FormatPreset.TXTM_COMPACT);

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

            <BlackButton onClick={onButtonClick}>
                {isLoading ? <LoadingSvg /> : <span>{t('intro.button')}</span>}
            </BlackButton>
        </Wrapper>
    );
}
