import { useQuery } from "@tanstack/react-query";
import { usersService } from "@/services/usersService";
import type { TableQueryParams } from "@/services/usersService";

export function useTableData(state: TableQueryParams) {
  const result = useQuery({
    queryKey: ["users", state],
    queryFn: () => usersService.getUsers(state),
    placeholderData: (previousData) => previousData,
  });
  return result; // isFetching, isLoading, isError, data all included
}
