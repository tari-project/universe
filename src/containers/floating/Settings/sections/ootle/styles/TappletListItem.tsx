import { memo } from 'react';
import { Content, ContentWrapper, TitleWrapper } from './ListItem.styles';
import { IconButton } from '@app/components/elements/buttons/IconButton';
import { IoEnterOutline, IoRemoveCircle } from 'react-icons/io5';

interface TappletItemProps {
    item: { id: number | string; display_name: string }; // added item with display_name and image
    handleStart?: () => void;
    handleRemove?: () => void;
}

export const TappletListItem = memo(function BaseItem({ item, handleStart, handleRemove }: TappletItemProps) {
    return (
        <ContentWrapper>
            <Content>
                <TitleWrapper title={item.display_name}>
                    {item.id}. {item.display_name}
                </TitleWrapper>
                <IconButton size="medium" type="button" onClick={handleStart}>
                    <IoEnterOutline />
                </IconButton>
                <IconButton color="brightGreen" size="medium" type="button" onClick={handleRemove}>
                    <IoRemoveCircle />
                </IconButton>
            </Content>
        </ContentWrapper>
    );
});
