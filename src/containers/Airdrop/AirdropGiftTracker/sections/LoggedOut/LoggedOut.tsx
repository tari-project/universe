import Gems from '../../components/Gems/Gems';
import { ClaimButton, Wrapper } from './styles';

export default function LoggedOut() {
    return (
        <Wrapper>
            <ClaimButton>
                <span>Claim Gems</span>
            </ClaimButton>

            <Gems number={500} label={`Unclaimed Gems`} />
        </Wrapper>
    );
}
