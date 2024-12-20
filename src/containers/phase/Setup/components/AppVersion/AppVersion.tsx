/* eslint-disable i18next/no-literal-string */
import { useEffect, useState } from 'react';
import { getVersion } from '@tauri-apps/api/app';
import { Wrapper } from './styles';

export default function AppVersion() {
    const [tariVersion, setTariVersion] = useState<string | null>(null);

    useEffect(() => {
        getVersion().then((version) => {
            setTariVersion(version);
        });
    }, []);

    if (!tariVersion) return null;

    return (
        <Wrapper>
            Testnet <span>v{tariVersion}</span>
        </Wrapper>
    );
}
