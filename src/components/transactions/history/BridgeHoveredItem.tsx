import { ReactNode } from 'react';
import { ButtonWrapper, HoverWrapper } from './ListItem.styles.ts';

interface Props {
    button?: ReactNode;
}

export default function BridgeItemHover({ button }: Props) {
    return (
        <HoverWrapper initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ButtonWrapper initial={{ opacity: 0, x: 5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 5 }}>
                {button}
            </ButtonWrapper>
        </HoverWrapper>
    );
}
