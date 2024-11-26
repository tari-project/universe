import Scanlines from '../components/Scanlines/Scanlines';
import Timer from './components/Timer/Timer';
import { BlackBox, GateImage, JewelImage, Wrapper } from './styles';

import jewelImage from './images/jewel.png';
import gateImage from './images/gate.png';

export default function SolvingWidget() {
    return (
        <Wrapper>
            <JewelImage src={jewelImage} alt="" />
            <GateImage src={gateImage} alt="" />
            <BlackBox>
                <Timer />
                <Scanlines />
            </BlackBox>
        </Wrapper>
    );
}
