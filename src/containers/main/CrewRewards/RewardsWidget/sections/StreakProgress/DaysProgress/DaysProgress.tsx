import { Pill, Pills, Text, Wrapper } from './styles';
import { useTranslation } from 'react-i18next';

interface Props {
    current: number;
    total: number;
}

export default function DaysProgress({ current, total }: Props) {
    const { t } = useTranslation();

    // Generate pills based on total days required
    const pills = Array.from({ length: total }, (_, index) => (
        <Pill key={index + 1} $isActive={current >= index + 1} />
    ));

    return (
        <Wrapper>
            <Pills>{pills}</Pills>
            <Text>
                {t('airdrop:crewRewards.streak.day')} {`${current}/${total}`}
            </Text>
        </Wrapper>
    );
}
