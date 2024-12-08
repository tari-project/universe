import MainTimer from './segments/MainTimer/MainTimer';
import SuperCharger from './segments/SuperCharger/SuperCharger';
import { BGImage1, BGImage2, ContentLayer, Wrapper } from './styles';

import bgImage1 from './images/sidebar_bg_1.png';
import bgImage2 from './images/sidebar_bg_2.png';

export default function SoSMainSidebar() {
    return (
        <Wrapper>
            <ContentLayer>
                <MainTimer />
                <SuperCharger />
            </ContentLayer>
            <BGImage1 src={bgImage1} alt="" />
            <BGImage2 src={bgImage2} alt="" />
        </Wrapper>
    );
}
