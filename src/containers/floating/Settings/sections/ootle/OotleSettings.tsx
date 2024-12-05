import ActiveDevTapplet from '@app/components/ootle/ActiveDevTapplet';
import TappletsDev from './TappletsDev';
import TappletsInstalled from './TappletsInstalled';
import TappletsRegistered from './TappletsRegistered';
import { useTappletsStore } from '@app/store/useTappletsStore';

export const OotleSettings = () => {
    const { activeTapplet } = useTappletsStore();
    return (
        <>
            {activeTapplet ? (
                <ActiveDevTapplet />
            ) : (
                <>
                    <TappletsRegistered />
                    <TappletsInstalled />
                    <TappletsDev />
                </>
            )}
        </>
    );
};
