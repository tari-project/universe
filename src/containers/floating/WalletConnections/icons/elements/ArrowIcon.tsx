export const ArrowIcon = ({ width = '100%', onClick }: { width: string | number; onClick?: () => void }) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={width} fill="none" viewBox="0 0 12 13" onClick={onClick}>
            <path
                stroke="#fff"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.698"
                d="M1.405 6.925 6.5 12.02l5.095-5.095M6.5 11.312V.98"
            />
        </svg>
    );
};
