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
      const res = await apiClient.get<MasterDataItem[] | { content: MasterDataItem[] }>(
        endpoints.masterData.list(resource),
        { size: 1000 },
      );
      if (res && typeof res === "object" && "content" in res && Array.isArray((res as any).content)) {
        return (res as any).content;
      }
      return Array.isArray(res) ? res : [];
    },
    enabled: !!resource,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}
