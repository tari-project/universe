import { useWalletStore } from '@app/store/useWalletStore';
import { BlackButton, Text, Title } from '../../styles';
import { WalletText, Warning, Wrapper } from './styles';
import { Trans, useTranslation } from 'react-i18next';
import LoadingSvg from '@app/components/svgs/LoadingSvg';
import { formatNumber, FormatPreset } from '@app/utils/formatters';
import { CircularProgress } from '@app/components/elements/CircularProgress';

interface Props {
    onButtonClick: () => void;
    isLoading: boolean;
}

export default function ProtectIntro({ onButtonClick, isLoading }: Props) {
    const { t } = useTranslation(['staged-security'], { useSuspense: false });

    const calculated_balance = useWalletStore((state) => state.calculated_balance);
    const isWalletScanning = !Number.isFinite(calculated_balance);
    const formatted_balance = formatNumber(calculated_balance || 0, FormatPreset.XTM_COMPACT); // Wallet still scanning

    return (
        <Wrapper>
            <Warning>{t('intro.warning')}</Warning>

            <Title>{t('intro.title')}</Title>

            <Text>{t('intro.text')}</Text>

            <WalletText>
                {isWalletScanning ? (
                    <CircularProgress />
                ) : (
                    <Trans
                        i18nKey="staged-security:intro.balance"
                        components={{
                            span: <span />,
                        }}
                        values={{ balance: formatted_balance }}
                    />
                )}
            </WalletText>

            <BlackButton onClick={onButtonClick}>
                {isLoading ? <LoadingSvg /> : <span>{t('intro.button')}</span>}
            </BlackButton>
        </Wrapper>
    );
}
