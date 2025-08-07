import { memo } from 'react';
import { Content, ContentWrapper, TitleWrapper } from './ListItem.styles';
import { IconButton } from '@app/components/elements/buttons/IconButton';
import { IoEnterOutline, IoRemoveCircle, IoStopCircle } from 'react-icons/io5';

interface TappletItemProps {
    item: { id: number | string; displayName: string }; // added item with displayName and image
    handleStart?: () => void;
    handleRemove?: () => void;
    handleStop?: () => void;
}

export const TappletListItem = memo(function BaseItem({
    item,
    handleStart,
    handleRemove,
    handleStop,
}: TappletItemProps) {
    return (
        <ContentWrapper>
            <Content>
                <TitleWrapper title={item.displayName}>
                    {item.id}. {item.displayName}
                </TitleWrapper>
                <IconButton size="medium" type="button" onClick={handleStart}>
                    <IoEnterOutline />
                </IconButton>
                <IconButton color="brightGreen" size="medium" type="button" onClick={handleRemove}>
                    <IoRemoveCircle />
                </IconButton>
                <IconButton color="brightGreen" size="medium" type="button" onClick={handleStop}>
                    <IoStopCircle />
                </IconButton>
            </Content>
        </ContentWrapper>
    );
});
