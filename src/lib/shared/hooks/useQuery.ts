import { useLocation } from "./useLocation";

export const useQuery = () => {
  const { search } = useLocation();
  return new URLSearchParams(search);
};
