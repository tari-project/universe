import TappletsDev from './TappletsDev';
import TappletsInstalled from './TappletsInstalled';
import TappletsRegistered from './TappletsRegistered';

export const OotleSettings = () => {
    return (
        <>
            <TappletsRegistered />
            <TappletsInstalled />
            <TappletsDev />
        </>
    );
};
