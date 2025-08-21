import { memo } from 'react';
import { Content, ContentWrapper, TitleWrapper } from './ListItem.styles';
import { IconButton } from '@app/components/elements/buttons/IconButton';
import { IoEnterOutline, IoRemoveCircle, IoRepeatOutline, IoStopCircle } from 'react-icons/io5';

interface TappletItemProps {
    item: { id: number | string; displayName: string; isRunning?: boolean }; // added item with displayName and image
    handleStart?: () => void;
    handleDelete?: () => void;
    handleStop?: () => void;
    handleRestart?: () => void;
}

export const TappletListItem = memo(function BaseItem({
    item,
    handleStart,
    handleDelete,
    handleStop,
    handleRestart,
}: TappletItemProps) {
    return (
        <ContentWrapper>
            <Content>
                <TitleWrapper title={item.displayName}>
                    {item.id}. {item.displayName} {item.isRunning ? 'ON' : ''}
                </TitleWrapper>
                <IconButton size="medium" type="button" onClick={handleStart}>
                    <IoEnterOutline />
                </IconButton>
                {handleDelete && (
                    <IconButton color="brightGreen" size="medium" type="button" onClick={handleDelete}>
                        <IoRemoveCircle />
                    </IconButton>
                )}
                {handleStop && (
                    <IconButton color="brightGreen" size="medium" type="button" onClick={handleStop}>
                        <IoStopCircle />
                    </IconButton>
                )}
                {handleRestart && (
                    <IconButton color="brightGreen" size="medium" type="button" onClick={handleRestart}>
                        <IoRepeatOutline />
                    </IconButton>
                )}
            </Content>
        </ContentWrapper>
    );
});
