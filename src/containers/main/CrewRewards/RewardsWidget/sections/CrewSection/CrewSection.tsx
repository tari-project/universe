import StreakProgress from '../StreakProgress/StreakProgress';
import CrewList from './CrewList/CrewList';
import Filters from './Filters/Filters';
import { IntroTextWrapper, Text, Title, Wrapper } from './styles';
import { useTranslation, Trans } from 'react-i18next';

export default function CrewSection() {
    const { t } = useTranslation();

    return (
        <Wrapper initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <StreakProgress isInline={true} />

            <IntroTextWrapper>
                <Title>{t('airdrop:crewRewards.myCrew')}</Title>
                <Text>
                    <Trans
                        i18nKey="airdrop:crewRewards.earnDescription"
                        values={{
                            userReward: 100,
                            daysRequired: 7,
                            friendReward: 50,
                        }}
                    />
                </Text>
            </IntroTextWrapper>

            <Filters />

            <CrewList />
        </Wrapper>
    );
}
