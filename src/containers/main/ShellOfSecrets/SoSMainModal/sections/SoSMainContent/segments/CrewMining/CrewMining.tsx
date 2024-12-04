/* eslint-disable i18next/no-literal-string */
import GrowCrew from '@app/containers/main/ShellOfSecrets/SoSWidget/segments/Friends/GrowCrew/GrowCrew';
import { SectionTitle, TopRow, Wrapper } from './styles';

export default function CrewMining() {
    return (
        <Wrapper>
            <TopRow>
                <SectionTitle>Crew mining</SectionTitle>

                <GrowCrew />
            </TopRow>
        </Wrapper>
    );
}
