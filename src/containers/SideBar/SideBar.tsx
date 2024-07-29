import React from 'react';
// import ExpandableBox from './ExpandableBox';
import TariMiner from './TariMiner/TariMiner';
import Wallet from './Wallet/Wallet';
import { SideBarContainer } from './styles';
import TestButtons from './TestButtons';

const App: React.FC = () => {
  return (
    <SideBarContainer>
      <TariMiner />
      <Wallet />
      <TestButtons />
    </SideBarContainer>
  );
};

export default App;

{
  /* <ExpandableBox initialWidth={'348px'} expandedWidth={'calc(100% - 40px)'}>
        <Typography variant="h6">Expandable Box Content</Typography>
        <Typography>
          This content is inside the expandable box. When expanded, it overlays
          the main content without affecting its layout.
        </Typography>
      </ExpandableBox> */
}
