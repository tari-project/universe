import { useAppConfigStore } from '@app/store/useAppConfigStore';

/**
 * A component that conditionally renders its children based on the application's pre-release flag.
 *
 * ```tsx
 * <PreReleaseAccessControl>
 *     <SomePreReleaseFeature />
 * </PreReleaseAccessControl>
 * ```
 */
export const PreReleaseAccessControl = ({ children, elseComponent = <></> }) => {
    const isPreRelease = useAppConfigStore((state) => state.pre_release);

    if (!isPreRelease) return elseComponent;

    return children instanceof Function ? children() : children;
};
