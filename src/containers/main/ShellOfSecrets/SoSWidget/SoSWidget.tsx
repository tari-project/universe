import Scanlines from '../components/Scanlines/Scanlines';
import Timer from './segments/Timer/Timer';
import { BlackBox, ContentLayer, GateImage, JewelImage, TopGroup, Wrapper } from './styles';

import jewelImage from './images/jewel.png';
import gateImage from './images/gate.png';
import Friends from './segments/Friends/Friends';
import Prize from './segments/Prize/Prize';

export default function SoSWidget() {
    return (
        <Wrapper initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }}>
            <JewelImage src={jewelImage} alt="" />
            <GateImage src={gateImage} alt="" />
            <BlackBox>
                <ContentLayer>
                    <TopGroup>
                        <Timer />
                        <Friends />
                    </TopGroup>

                    <Prize />
                </ContentLayer>
                <Scanlines />
            </BlackBox>
        </Wrapper>
    );
}
