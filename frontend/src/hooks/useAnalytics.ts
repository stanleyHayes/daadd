import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { DashboardMetrics, TimeSeriesPoint, FunnelData, DeviceBreakdownData, ApiResponse, FilterOptions } from '@/types';

export function useAggregateDashboard(filters?: FilterOptions) {
  return useQuery({
    queryKey: ['aggregateDashboard', filters],
    queryFn: async () => {
      const params = { ...filters };
      const res = await api.get<ApiResponse<DashboardMetrics>>('/analytics/dashboard', { params });
      return res.data.data;
    },
  });
}

export function useDashboardMetrics(campaignId?: string, filters?: FilterOptions) {
  return useQuery({
    queryKey: ['dashboardMetrics', campaignId, filters],
    queryFn: async () => {
      const params = { ...filters };
      const res = await api.get<ApiResponse<DashboardMetrics>>(`/analytics/dashboard/${campaignId}`, { params });
      return res.data.data;
    },
    enabled: !!campaignId,
  });
}

export function useTimeSeries(campaignId?: string, filters?: FilterOptions) {
  return useQuery({
    queryKey: ['timeSeries', campaignId, filters],
    queryFn: async () => {
      const params = { ...filters };
      const res = await api.get<ApiResponse<TimeSeriesPoint[]>>(`/analytics/timeseries/${campaignId}`, { params });
      return res.data.data;
    },
    enabled: !!campaignId,
  });
}

export function useFunnelData(campaignId?: string) {
  return useQuery({
    queryKey: ['funnel', campaignId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<FunnelData[]>>(`/analytics/funnel/${campaignId}`);
      return res.data.data;
    },
    enabled: !!campaignId,
  });
}

export function useDeviceBreakdown(campaignId?: string) {
  return useQuery({
    queryKey: ['deviceBreakdown', campaignId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<DeviceBreakdownData[]>>(`/analytics/devices/${campaignId}`);
      return res.data.data;
    },
    enabled: !!campaignId,
  });
}

export function useExportCSV() {
  return useMutation({
    mutationFn: async (params: { campaignId?: string; filters?: FilterOptions }) => {
      const res = await api.get(`/analytics/export/${params.campaignId}/csv`, {
        params: { ...params.filters },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'analytics-export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
  });
}

export function useExportPDF() {
  return useMutation({
    mutationFn: async (params: { campaignId?: string; filters?: FilterOptions }) => {
      const res = await api.get(`/analytics/export/${params.campaignId}/pdf`, {
        params: { ...params.filters },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'analytics-report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
  });
}
