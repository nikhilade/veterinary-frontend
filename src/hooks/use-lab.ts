import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import type { LabOrderDto, LabResultDto, CreateLabResultRequest } from "@/lib/api/types";

export function useLabOrders() {
  return useQuery({
    queryKey: ["labOrders"],
    queryFn: () => apiClient.get<LabOrderDto[]>(endpoints.labOrders.list),
  });
}

export function useLabResult(labOrderId: string | null) {
  return useQuery({
    queryKey: ["labResult", labOrderId],
    queryFn: () => {
      if (!labOrderId) return null;
      return apiClient.get<LabResultDto>(endpoints.labResults.byOrder(labOrderId));
    },
    enabled: !!labOrderId,
    retry: false, // Don't retry if result not found (e.g. for ORDERED status)
  });
}

export function useCreateLabResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLabResultRequest) =>
      apiClient.post<LabResultDto>(endpoints.labResults.create, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labOrders"] });
      queryClient.invalidateQueries({ queryKey: ["labResult"] });
    },
  });
}
