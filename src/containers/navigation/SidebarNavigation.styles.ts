import * as m from 'motion/react-m';
import styled from 'styled-components';

import { SB_SPACING } from '@app/theme/styles.ts';

export const SidebarNavigationWrapper = styled(m.div)`
    height: 100%;
    display: flex;
    gap: ${SB_SPACING}px;
    pointer-events: all;
    z-index: 10;
`;
