import { createContext, useContext } from 'react';

export const RerenderChainContext = createContext<string | null>(null);

export function useParentName(): string | null {
  return useContext(RerenderChainContext);
}
