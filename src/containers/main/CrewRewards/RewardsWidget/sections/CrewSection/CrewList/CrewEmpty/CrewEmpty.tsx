import InviteFriendsButton from '../../../MainSection/segments/TopRow/InviteFriendsButton/InviteFriendsButton';
import { Wrapper, Title, Text, Buttons, ButtonOutline, TextWrapper } from './styles';
import { useTranslation, Trans } from 'react-i18next';

interface Props {
    inactiveCount?: number;
    onFilterChange: (status: 'active' | 'inactive') => void;
}

export default function CrewEmpty({ inactiveCount = 0, onFilterChange }: Props) {
    const { t } = useTranslation();
    const isSingular = inactiveCount === 1;
    const isZero = inactiveCount === 0;

    const getTitleKey = () => {
        if (isZero) return 'airdrop:crewRewards.crewEmpty.titleZero';
        if (isSingular) return 'airdrop:crewRewards.crewEmpty.titleSingular';
        return 'airdrop:crewRewards.crewEmpty.title';
    };

    const getDescriptionKey = () => {
        if (isZero) return 'airdrop:crewRewards.crewEmpty.descriptionZero';
        if (isSingular) return 'airdrop:crewRewards.crewEmpty.descriptionSingular';
        return 'airdrop:crewRewards.crewEmpty.description';
    };

    return (
        <Wrapper>
            <TextWrapper>
                <Title>{t(getTitleKey())}</Title>

                <Text>
                    <Trans i18nKey={getDescriptionKey()} values={{ inactiveCount }} />
                </Text>
            </TextWrapper>

            <Buttons $singleButton={isZero}>
                {!isZero && (
                    <ButtonOutline onClick={() => onFilterChange('inactive')}>
                        {t(
                            isSingular
                                ? 'airdrop:crewRewards.crewEmpty.nudgeButtonSingular'
                                : 'airdrop:crewRewards.crewEmpty.nudgeButton'
                        )}
                    </ButtonOutline>
                )}
                <InviteFriendsButton largeButton={true} />
            </Buttons>
        </Wrapper>
    );
}
