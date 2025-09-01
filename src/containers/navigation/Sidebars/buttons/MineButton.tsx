import { memo, useEffect } from 'react';
import { Button, DecorationWrapper, Wrapper } from './styles.ts';
import { useUIStore } from '@app/store/useUIStore.ts';
import { setSidebarOpen, setShowTapplet } from '@app/store/actions/uiStoreActions';
import { setAnimationProperties } from '@tari-project/tari-tower';
import ConnectedPulse from '../../components/VersionChip/ConnectedPulse/ConnectedPulse.tsx';
import { useConfigUIStore } from '@app/store';

const MineButton = memo(function MineButton() {
    const sidebarOpen = useUIStore((s) => s.sidebarOpen);
    const visualMode = useConfigUIStore((s) => s.visual_mode);
    const towerSidebarOffset = useUIStore((s) => s.towerSidebarOffset);
    const showTapplet = useUIStore((s) => s.showTapplet);

    function handleClick() {
        if (showTapplet) {
            setSidebarOpen(true);
            setShowTapplet(false);
        } else {
            setSidebarOpen(!sidebarOpen);
        }
    }

    useEffect(() => {
        if (!visualMode) return;
        setAnimationProperties([
            { property: 'offsetX', value: towerSidebarOffset },
            { property: 'cameraOffsetX', value: towerSidebarOffset / window.innerWidth },
        ]);
    }, [visualMode, towerSidebarOffset]);

    return (
        <Wrapper>
            <DecorationWrapper>
                <ConnectedPulse size={8} />
            </DecorationWrapper>

            <Button type="button" onClick={handleClick} $isActive={sidebarOpen} $isToggle={true}>
                <svg width="28" height="30" viewBox="0 0 28 30" fill="none">
                    <path
                        d="M26.6824 6.69766L15.3178 0.34323C14.5021 -0.112827 13.4968 -0.114459 12.6798 0.338659L1.32575 6.63432C0.505692 7.08907 0 7.93296 0 8.84605V21.1648C0 22.0834 0.511439 22.9309 1.33894 23.3837L12.8242 29.6686C13.6388 30.1142 14.637 30.1103 15.4476 29.6578L26.6807 23.3876C27.497 22.9319 28 22.0903 28 21.1795V8.90481C28 7.99466 27.498 7.15371 26.6824 6.69766ZM8.62888 4.6299L14.0056 1.66733C14.1053 1.61248 14.2277 1.61248 14.3277 1.66733L19.6993 4.6299C19.9164 4.7497 19.9181 5.05135 19.702 5.17312L14.3304 8.20032C14.2294 8.25745 14.1043 8.25745 14.0032 8.20032L8.62651 5.17312C8.41051 5.05135 8.41186 4.74938 8.62922 4.6299H8.62888ZM8.11237 24.7594C8.11237 25.0101 7.83079 25.1661 7.60668 25.0398L2.06435 21.914C1.96125 21.8559 1.8977 21.7491 1.8977 21.6336V15.5331C1.8977 15.2831 2.17826 15.1267 2.40271 15.2524L7.94505 18.355C8.04882 18.4131 8.11271 18.5202 8.11271 18.6361V24.7594H8.11237ZM19.9738 18.7702L14.681 21.7247C14.4082 21.8771 14.0718 21.8784 13.7977 21.7282L8.38955 18.7689C8.11102 18.6165 7.93862 18.3312 7.93862 18.0217V12.0734C7.93862 11.7659 8.10899 11.4818 8.38516 11.3287L13.7338 8.3629C14.009 8.21044 14.3473 8.21077 14.6221 8.36453L19.9745 11.3571C20.249 11.5106 20.418 11.7939 20.418 12.1001V18.0266C20.418 18.3331 20.2486 18.6165 19.9738 18.7699V18.7702ZM26.3 21.9065L20.7577 25.0323C20.5336 25.1586 20.252 25.0026 20.252 24.7519V18.6286C20.252 18.5127 20.3159 18.4056 20.4197 18.3475L25.962 15.2449C26.1861 15.1195 26.4667 15.2756 26.4667 15.5256V21.6261C26.4667 21.7416 26.4031 21.8484 26.3 21.9065Z"
                        fill="currentColor"
                    />
                </svg>
            </Button>
        </Wrapper>
    );
});

export default MineButton;
