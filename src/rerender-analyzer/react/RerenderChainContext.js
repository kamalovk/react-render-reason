import { createContext, useContext } from 'react';

/**
 * RerenderChainContext передаёт имя ближайшего отслеживаемого предка
 * вниз по дереву компонентов, позволяя строить цепочку parent → child.
 *
 * @type {React.Context<string | null>}
 */
export const RerenderChainContext = createContext(null);

/**
 * useParentName — возвращает имя ближайшего отслеживаемого родителя.
 * @returns {string | null}
 */
export function useParentName() {
  return useContext(RerenderChainContext);
}
