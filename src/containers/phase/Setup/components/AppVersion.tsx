import { useEffect, useState } from 'react';
import { getVersion } from '@tauri-apps/api/app';
import { Typography } from '@app/components/elements/Typography';

export default function AppVersion() {
    const [tariVersion, setTariVersion] = useState<string | null>(null);

    useEffect(() => {
        getVersion().then((version) => {
            setTariVersion(version);
        });
    }, []);

    return tariVersion ? (
        <Typography variant="span" style={{ zIndex: 1000, position: 'absolute', right: 12, bottom: 6 }}>
            {tariVersion}
        </Typography>
    ) : null;
}
