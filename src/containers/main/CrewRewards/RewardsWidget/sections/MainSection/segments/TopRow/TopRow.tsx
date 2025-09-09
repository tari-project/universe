import { ActionButtons, IconImage, RightSide, Title, Wrapper } from './styles';
import coinImage from '../../../../../images/coin_solo.png';
import InviteFriendsButton from './InviteFriendsButton/InviteFriendsButton';
import { useTranslation } from 'react-i18next';
import ToggleButton from './ToggleButton/ToggleButton';
import MinimizeButton from './MinimizeButton/MinimizeButton';

export default function TopRow() {
    const { t } = useTranslation();

    return (
        <Wrapper>
            <Title>
                <IconImage src={coinImage} alt="" aria-hidden="true" /> {t('airdrop:crewRewards.title')}
            </Title>

            <RightSide>
                <InviteFriendsButton />
                <ActionButtons>
                    <MinimizeButton />
                    <ToggleButton />
                </ActionButtons>
            </RightSide>
        </Wrapper>
    );
}
