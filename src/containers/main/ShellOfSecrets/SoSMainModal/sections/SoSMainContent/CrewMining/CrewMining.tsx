/* eslint-disable i18next/no-literal-string */
import GrowCrew from '@app/containers/main/ShellOfSecrets/SoSWidget/segments/Friends/GrowCrew/GrowCrew';
import { Divider, LeftSide, Mining, Rate, SectionTitle, TopRow, Wrapper } from './styles';
import GreenArrowIcon from './icons/GreenArrowIcon';
import CrewList from './CrewList/CrewList';

export default function CrewMining() {
    return (
        <Wrapper>
            <TopRow>
                <LeftSide>
                    <SectionTitle>Crew mining</SectionTitle>
                    <Divider />
                    <Rate>+45min/hr</Rate>
                    <Mining>
                        6/32 Mining
                        <GreenArrowIcon />
                    </Mining>
                </LeftSide>
                <GrowCrew />
            </TopRow>

            <CrewList />
        </Wrapper>
    );
}
