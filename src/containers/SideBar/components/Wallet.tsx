import {Typography, Stack, Divider} from '@mui/material';
import {ThemeProvider} from '@mui/material/styles';
import {WalletContainer, Handle, HoverStack, WalletButton} from '../styles';
import {darkTheme} from '../../../theme/themes';
import useAppStateStore from '../../../store/appStateStore';
import {AddressBox, BalanceChangeChip} from '../styles';
import {FaCircleArrowUp} from 'react-icons/fa6';

function Wallet() {
    const wallet = useAppStateStore((state) => state.wallet);
    const address = '🚀⏰🎉';
    return (
        <ThemeProvider theme={darkTheme}>
            <WalletContainer>
                <Stack
                    direction="column"
                    spacing={0.5}
                    alignItems="center"
                    width="100%"
                    height="90px"
                >
                    <Handle/>
                    <Stack
                        direction="column"
                        spacing={1}
                        alignItems="flex-end"
                        width="100%"
                    >
                        <AddressBox>{address}</AddressBox>
                    </Stack>
                </Stack>
                <Stack ml="10px">
                    <Typography variant="body2" mb={1}>
                        Wallet Balance
                    </Typography>
                    <Stack
                        direction="row"
                        spacing={0.5}
                        alignItems="baseline"
                        justifyContent="space-between"
                        width="100%"
                    >
                        <Stack direction="row" spacing={0.2} alignItems="baseline">
                            <Typography variant="h2" fontSize="50px">
                                {wallet.balance / 1_000_000}
                            </Typography>
                            <Typography variant="h4">XTM</Typography>
                        </Stack>
                        <BalanceChangeChip
                            direction="up"
                            icon={<FaCircleArrowUp size={20}/>}
                            label="30%"
                        />
                    </Stack>
                </Stack>
                <HoverStack className="hover-stack">
                    <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="space-between"
                        divider={<Divider orientation="vertical"/>}
                        style={{
                            borderTop: '1px solid rgba(255,255,255,0.1)',
                            marginTop: '10px',
                            paddingTop: '10px',
                            width: '100%',
                        }}
                    >
                        <WalletButton
                            variant="contained"
                            fullWidth
                            onClick={() => console.log('Send')}
                        >
                            Send
                        </WalletButton>
                        <WalletButton
                            variant="contained"
                            fullWidth
                            onClick={() => console.log('Receive')}
                        >
                            Receive
                        </WalletButton>
                    </Stack>
                </HoverStack>
            </WalletContainer>
        </ThemeProvider>
    );
}

export default Wallet;
