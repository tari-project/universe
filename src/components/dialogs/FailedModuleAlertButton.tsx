import styled from 'styled-components';
import alertEmoji from '/assets/img/icons/emoji/alert_emoji.png';
import { setDialogToShow } from '@app/store';

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
    return (
        <StyledCTA onClick={() => setDialogToShow('failedModuleInitialization')}>
            <img src={alertEmoji} alt="Alert icon" />
        </StyledCTA>
    );
}
