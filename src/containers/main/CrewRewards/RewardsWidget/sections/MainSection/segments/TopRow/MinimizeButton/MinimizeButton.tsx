import { useCrewRewardsStore } from '@app/store/useCrewRewardsStore';
import { Wrapper } from './styles';

export default function MinimizeButton() {
    const { isMinimized, setIsMinimized } = useCrewRewardsStore();

    const handleClick = () => {
        setIsMinimized(!isMinimized);
    };

    return (
        <Wrapper type="button" onClick={handleClick}>
            <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                    opacity="0.5"
                    d="M10.5 1.96875C5.79592 1.96875 1.96875 5.79592 1.96875 10.5C1.96875 15.2041 5.79592 19.0312 10.5 19.0312C15.2041 19.0312 19.0312 15.2041 19.0312 10.5C19.0312 5.79592 15.2041 1.96875 10.5 1.96875ZM13.7812 11.1562H7.21875C7.0447 11.1562 6.87778 11.0871 6.75471 10.964C6.63164 10.841 6.5625 10.674 6.5625 10.5C6.5625 10.326 6.63164 10.159 6.75471 10.036C6.87778 9.91289 7.0447 9.84375 7.21875 9.84375H13.7812C13.9553 9.84375 14.1222 9.91289 14.2453 10.036C14.3684 10.159 14.4375 10.326 14.4375 10.5C14.4375 10.674 14.3684 10.841 14.2453 10.964C14.1222 11.0871 13.9553 11.1562 13.7812 11.1562Z"
                    fill="white"
                />
            </svg>
        </Wrapper>
    );
}
