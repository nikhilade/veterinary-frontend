import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";

export interface MasterDataItem {
  id: string;
  name: string;
  [key: string]: any;
}

export function useMasterData(resource: string | null) {
  return useQuery({
    queryKey: ["master-data", resource],
    queryFn: async () => {
      if (!resource) return [];
      const data = await apiClient.get<MasterDataItem[]>(endpoints.masterData.list(resource));
      return data || [];
    },
    enabled: !!resource,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}
