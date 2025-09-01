import styled from 'styled-components';
import alertEmoji from '/assets/img/icons/emoji/alert_emoji.png';
import { setDialogToShow } from '@app/store';
import { useTranslation } from 'react-i18next';

const StyledCTA = styled.button`
    padding: 3px;
    width: 25px;
    height: 25px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    img {
        display: flex;
        max-width: 100%;
    }
`;

export default function FailedModuleAlertButton() {
    const { t } = useTranslation('common');
    return (
        <StyledCTA
            onClick={() => setDialogToShow('failedModuleInitialization')}
            aria-label="FailedModuleAlertButton"
            title={t('click-to-view-details')}
        >
            <img src={alertEmoji} alt="Alert icon" />
        </StyledCTA>
    );
}
