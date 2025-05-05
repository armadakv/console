import { ReactNode, useEffect } from 'react';

import { useNavigation } from '../context/NavigationContext';

/**
 * Hook to set the page title and action in the navigation context
 * This replaces the need for the PageHeader component in each page
 */
const usePageTitle = (title: string, action?: ReactNode) => {
    const { setPageTitle, setPageAction, resetPageAction } = useNavigation();

    useEffect(() => {
        setPageTitle(title);

        if (action) {
            setPageAction(action);
        } else {
            resetPageAction();
        }

        return () => {
            resetPageAction();
        };
    }, [title, action, setPageTitle, setPageAction, resetPageAction]);
};

export default usePageTitle;