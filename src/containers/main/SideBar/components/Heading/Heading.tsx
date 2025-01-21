import { Stack } from '@app/components/elements/Stack.tsx';
import OpenSettingsButton from '@app/containers/floating/Settings/components/OpenSettingsButton';
import packageInfo from '../../../../../../package.json';

import VersionChip from '../VersionChip/VersionChip';
import { LogoText, LogoWrapper } from './styles';
import LogoIcon from './LogoIcon';

const appVersion = packageInfo.version;
const versionString = `v${appVersion}`;

function Heading() {
    return (
        <Stack direction="row" justifyContent="space-between">
            <Stack
                direction="row"
                alignItems="center"
                gap={10}
                style={{
                    transform: 'translateY(-2px)',
                }}
            >
                <LogoWrapper>
                    <LogoIcon />
                    <LogoText>UNIVERSE</LogoText>
                </LogoWrapper>
                <VersionChip version={versionString} />
            </Stack>
            <OpenSettingsButton />
        </Stack>
    );
}

export default Heading;
