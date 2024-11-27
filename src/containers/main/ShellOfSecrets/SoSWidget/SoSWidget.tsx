import Scanlines from '../components/Scanlines/Scanlines';
import Timer from './components/Timer/Timer';
import { BlackBox, ContentLayer, GateImage, JewelImage, Wrapper } from './styles';

import jewelImage from './images/jewel.png';
import gateImage from './images/gate.png';
import Friends from './components/Friends/Friends';

export default function SoSWidget() {
    return (
        <Wrapper>
            <JewelImage src={jewelImage} alt="" />
            <GateImage src={gateImage} alt="" />
            <BlackBox>
                <ContentLayer>
                    <Timer />
                    <Friends />
                </ContentLayer>
                <Scanlines />
            </BlackBox>
        </Wrapper>
    );
}
