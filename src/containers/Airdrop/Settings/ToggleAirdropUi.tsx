// import { ToggleSwitch } from '@app/components/elements/ToggleSwitch';
import { Wrapper } from './styles';
// import { useAirdropStore } from '@app/store/useAirdropStore';
// import { useCallback, useRef, useState } from 'react';

export const ToggleAirdropUi = () => {
    // const { wipUI, setWipUI } = useAirdropStore();
    // const [disabled, setDisabled] = useState(!wipUI);
    // const clickCountRef = useRef(0);

    // const toggleWipUI = useCallback(() => {
    //     if (disabled) {
    //         if (clickCountRef.current > 9) {
    //             setDisabled(false);
    //         } else {
    //             clickCountRef.current = clickCountRef.current + 1;
    //             return;
    //         }
    //     }
    //     setWipUI(!wipUI);
    // }, [disabled, setWipUI, wipUI]);

    return <Wrapper>{/* <ToggleSwitch label="Enable Airdrop UI" checked={wipUI} onChange={toggleWipUI} /> */}</Wrapper>;
};
