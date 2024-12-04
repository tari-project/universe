import MainTimer from './segments/MainTimer/MainTimer';
import SuperCharger from './segments/SuperCharger/SuperCharger';
import { BGImage1, BGImage2, ContentLayer, Wrapper } from './styles';

export default function SoSMainSidebar() {
    return (
        <Wrapper>
            <ContentLayer>
                <MainTimer />
                <SuperCharger />
            </ContentLayer>
            <BGImage1 />
            <BGImage2 />
        </Wrapper>
    );
}
