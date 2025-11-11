export default function SelectedIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="21"
            height="22"
            viewBox="0 0 21 22"
            fill="none"
            className={className}
        >
            <circle cx="10.5" cy="11" r="10.5" fill="white" />
            <path
                d="M8.89582 12.2886L6.18005 9.4559L4.7832 10.8138L8.85753 15.0427L15.8988 8.17615L14.541 6.7793L8.89582 12.2886Z"
                fill="black"
            />
        </svg>
    );
}
