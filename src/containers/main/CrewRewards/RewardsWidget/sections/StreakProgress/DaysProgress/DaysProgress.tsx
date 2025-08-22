import { Pill, Pills, Text, Wrapper } from './styles';
import { useTranslation } from 'react-i18next';

interface Props {
    current: number;
    total: number;
}

export default function DaysProgress({ current, total }: Props) {
    const { t } = useTranslation();

    return (
        <Wrapper>
            <Pills>
                <Pill $isActive={current >= 1} />
                <Pill $isActive={current >= 2} />
                <Pill $isActive={current >= 3} />
            </Pills>
            <Text>
                {t('airdrop:crewRewards.streak.day')} {`${current}/${total}`}
            </Text>
        </Wrapper>
    );
}
