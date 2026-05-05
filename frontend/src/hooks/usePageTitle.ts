import { useEffect } from 'react';

import { useNavigation } from '@/context/NavigationContext';
import { BreadcrumbItem } from '@/shared/Breadcrumb';

export const useBreadcrumbs = (items: BreadcrumbItem[]) => {
  const { setBreadcrumbs } = useNavigation();

  useEffect(() => {
    setBreadcrumbs(items);
    return () => setBreadcrumbs([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setBreadcrumbs, JSON.stringify(items)]);
};
