import TappletsDev from './TappletsDev';
import TappletsInstalled from './TappletsInstalled';
import TappletsRegistered from './TappletsRegistered';

export const TappletsOverview = () => {
    return (
        <>
            <TappletsRegistered />
            <TappletsInstalled />
            <TappletsDev />
        </>
    );
};
