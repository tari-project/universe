import CrewSection from './sections/CrewSection/CrewSection';
import MainSection from './sections/MainSection/MainSection';
import { Divider, PositionWrapper, WidgetWrapper } from './styles';

export default function RewardsWidget() {
    return (
        <PositionWrapper initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }}>
            <WidgetWrapper>
                <MainSection />
                <Divider />
                <CrewSection />
            </WidgetWrapper>
        </PositionWrapper>
    );
}
