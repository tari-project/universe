import styled from 'styled-components';

const ListItem = styled.li`
    color: ${({ theme }) => theme.palette.text.secondary};
    font-size: 12px;
    font-weight: 400;
`;

const ListWrapper = styled.div`
    display: flex;
    width: 100%;
    ol,
    ul {
        max-width: 100%;
        padding: 0;
        padding-inline-start: 20px;
        line-height: 1.35;
        margin: 0;
    }
`;

interface ListProps {
    items: string[];
    ordered?: boolean;
}

export const List = ({ items, ordered = false }: ListProps) => {
    const itemMarkup = items?.map((item, i) => <ListItem key={`list-item:${i}`}>{item}</ListItem>);

    return <ListWrapper>{ordered ? <ol>{itemMarkup}</ol> : <ul>{itemMarkup}</ul>}</ListWrapper>;
};
