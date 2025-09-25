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

    return (
        <Wrapper>
            <TextWrapper>
                <Title>
                    {t(
                        isSingular
                            ? 'airdrop:crewRewards.crewEmpty.titleSingular'
                            : 'airdrop:crewRewards.crewEmpty.title'
                    )}
                </Title>

                <Text>
                    <Trans
                        i18nKey={
                            isSingular
                                ? 'airdrop:crewRewards.crewEmpty.descriptionSingular'
                                : 'airdrop:crewRewards.crewEmpty.description'
                        }
                        values={{ inactiveCount }}
                    />
                </Text>
            </TextWrapper>

            <Buttons>
                <ButtonOutline onClick={() => onFilterChange('inactive')}>
                    {t(
                        isSingular
                            ? 'airdrop:crewRewards.crewEmpty.nudgeButtonSingular'
                            : 'airdrop:crewRewards.crewEmpty.nudgeButton'
                    )}
                </ButtonOutline>
                <InviteFriendsButton largeButton={true} />
            </Buttons>
        </Wrapper>
    );
}
