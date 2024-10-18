import PaperWallet from '@app/containers/Settings/sections/wallet/PaperWallet.tsx';
import ThemeSettings from '@app/containers/Settings/sections/general/ThemeSettings.tsx';

export const TempSettings = () => {
    return (
        <>
            <ThemeSettings />
            <PaperWallet />
        </>
    );
};
