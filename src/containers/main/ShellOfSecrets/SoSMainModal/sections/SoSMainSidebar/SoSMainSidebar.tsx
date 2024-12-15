import MainTimer from './MainTimer/MainTimer';
import SuperCharger from './SuperCharger/SuperCharger';
import { ContentLayer, Wrapper } from './styles';

export default function SoSMainSidebar() {
    return (
        <Wrapper>
            <ContentLayer>
                <MainTimer />
                <SuperCharger />
            </ContentLayer>
        </Wrapper>
    );
}
