export const bannerVariants = {
    hidden: {
        scale: 0,
        opacity: 0,
    },
    visible: {
        scale: 1,
        opacity: 1,
        transition: {
            duration: 0.3,
            ease: 'easeOut',
            // --- 3. Orchestrate Transition ---
            // Tell this parent variant to delay its children's animation
            delayChildren: 0.3, // Start children animation exactly when parent finishes (duration = 0.3)
            staggerChildren: 0.2, // Stagger direct motion children slightly (ContentContainer)
        },
    },
    exit: {
        scale: 0,
        opacity: 0,
        transition: {
            duration: 0.2,
            ease: 'easeIn',
            // Optional: Animate children out before parent if needed
            // when: "afterChildren",
            // staggerChildren: 0.1,
            // staggerDirection: -1
        },
    },
};

export const contentItemVariants = {
    hidden: {
        opacity: 0,
        y: -15, // Animate from slightly above
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.3,
            ease: 'easeOut',
        },
    },
    exit: {
        // Define exit variant if needed for smooth switching / exit sequence
        opacity: 0,
        y: 15,
        transition: {
            duration: 0.15,
            ease: 'easeIn',
        },
    },
};

export const contentContainerVariants = {
    hidden: {
        opacity: 0,
        width: 0,
        marginLeft: 0, // Ensure margin animates too if needed
    },
    visible: {
        opacity: 1,
        width: 'auto', // Animate width if desired, otherwise just opacity might be smoother
        marginLeft: 12,
        transition: {
            duration: 0.4, // Duration for the container itself
            ease: 'easeOut',
            // Optionally, stagger children *within* the content container
            delayChildren: 0.1, // Small delay after container appears
            staggerChildren: 0.15,
        },
    },
    exit: {
        opacity: 0,
        width: 0, // Animate width out
        marginLeft: 0,
        transition: {
            duration: 0.2,
            ease: 'easeIn',
            // Make sure children exit before or during container exit
            // when: "afterChildren", // If staggering children out first is desired
            // staggerChildren: 0.1,
            // staggerDirection: -1
        },
    },
};
