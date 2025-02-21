import { useTappletProviderStore } from '@app/store/useTappletProviderStore';
import { Box, IconButton, Typography } from '@mui/material';
import { Tapplet } from './Tapplet';
import { MdClose } from 'react-icons/md';
import { useTappletsStore } from '@app/store/useTappletsStore';
import { HeaderContainer } from './styles';

export default function ActiveTappletView() {
    const tappProvider = useTappletProviderStore((s) => s.tappletProvider);
    const tapplet = useTappletsStore((s) => s.activeTapplet);
    const deactivateTapplet = useTappletsStore((s) => s.deactivateTapplet);

    return (
        <>
            <HeaderContainer>
                <IconButton onClick={() => deactivateTapplet()}>
                    <MdClose size={18} />
                </IconButton>
                <Typography variant="h6">
                    {tapplet ? `${tapplet.display_name} v${tapplet.version} ` : 'Unknown tapplet'}
                </Typography>
            </HeaderContainer>
            <Box height="100%" width="100%">
                {tapplet && <Tapplet source={tapplet?.source} provider={tappProvider} />}
            </Box>
        </>
    );
}
