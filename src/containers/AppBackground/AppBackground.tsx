import { useTheme } from '@mui/material/styles';
import clouds from '../../assets/backgrounds/clouds.png';
import { styled } from '@mui/material/styles';
import { Box } from '@mui/material';
import loading from '../../assets/backgrounds/loading.jpg';
import defaultbg from '../../assets/backgrounds/defaultbg.jpg';
import determining from '../../assets/backgrounds/determining.jpg';
import mining from '../../assets/backgrounds/mining.jpg';
import loser from '../../assets/backgrounds/loser.jpg';
import winner from '../../assets/backgrounds/winner.jpg';
import { backgroundType } from '../../store/types';

const AppContainer = styled(Box)(
  ({ theme, status }: { theme: any; status: any }) => ({
    backgroundColor: theme.palette.background.default,
    backgroundSize: 'cover',
    backgroundImage: `url(${status})`,
    backgroundPosition: 'center',
  })
);

// const BackgroundImage = styled(Box)(
//   ({ theme, status }: { theme: any; status: statusType }) => ({
//     position: 'absolute',
//     bottom: 0,
//     right: 0,
//     height: '80%',
//     width: `calc(100% - ${sidebarWidth} - ${theme.spacing(4)})`,
//     backgroundImage: `url(${
//       status === 'mining' ? build1 : status === 'waiting' ? build3 : ''
//     })`,
//     backgroundPosition: 'bottom center',
//     backgroundRepeat: 'no-repeat',
//     backgroundSize: 'contain',
//     zIndex: 0,
//     borderRadius: '12px',
//     overflow: 'hidden',
//     border: '1px solid red',
//   })
// );

function AppBackground({
  children,
  status,
}: {
  children: React.ReactNode;
  status: backgroundType;
}) {
  const theme = useTheme();

  let bg = defaultbg;

  switch (status) {
    case 'onboarding':
      bg = clouds;
      break;
    case 'determining':
      bg = determining;
      break;
    case 'loading':
      bg = loading;
      break;
    case 'mining':
      bg = mining;
      break;
    case 'loser':
      bg = loser;
      break;
    case 'winner':
      bg = winner;
      break;
    case 'idle':
      bg = defaultbg;
      break;
    default:
      bg = defaultbg;
      break;
  }

  return (
    <AppContainer theme={theme} status={bg}>
      {children}
      {/* <BackgroundImage theme={theme} status={status} /> */}
    </AppContainer>
  );
}

export default AppBackground;
