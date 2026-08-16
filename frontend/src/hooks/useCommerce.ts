import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiResponse } from '@/types';
import toast from 'react-hot-toast';

/**
 * Marketplace commerce (Phase 5): merchant products, and orders across the
 * buyer / merchant / admin views. All money is integer minor units (pesewas).
 */
export type OrderStatus =
  | 'created'
  | 'payment_pending'
  | 'paid'
  | 'accepted'
  | 'preparing'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'disputed'
  | 'refunded'
  | 'cancelled'
  | 'expired';

export interface Product {
  id: string;
  merchant_id: string;
  name: string;
  description: string;
  category: string;
  price_minor: number;
  currency: string;
  images: string[];
  stock?: number;
  is_active: boolean;
  created_at: string;
}

export interface OrderItem {
  product_id: string;
  name: string;
  unit_price_minor: number;
  quantity: number;
}

export interface OrderHistory {
  status: OrderStatus;
  actor: string;
  note?: string;
  at: string;
}

export interface Order {
  id: string;
  buyer_id: string;
  merchant_id: string;
  items: OrderItem[];
  subtotal_minor: number;
  total_minor: number;
  currency: string;
  status: OrderStatus;
  contact?: { name: string; phone: string; address: string; city: string };
  history: OrderHistory[];
  dispute?: {
    reason: string;
    detail: string;
    evidence: string[];
    resolution?: 'refunded' | 'released';
  };
  auto_release_at?: string;
  created_at: string;
}

/** Format integer minor units as a currency string, e.g. 5000 → "GH₵50.00". */
export function formatMinor(minor: number, currency = 'GHS'): string {
  const symbol = currency === 'GHS' ? 'GH₵' : `${currency} `;
  return `${symbol}${(minor / 100).toFixed(2)}`;
}

// --- Products --------------------------------------------------------------

export function useMyProducts() {
  return useQuery({
    queryKey: ['products', 'mine'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Product[]>>('/products/mine');
      return res.data.data;
    },
  });
}

export function useSaveProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Product> & { id?: string }) => {
      const { id, ...body } = input;
      const res = id
        ? await api.patch<ApiResponse<Product>>(`/products/${id}`, body)
        : await api.post<ApiResponse<Product>>('/products', body);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product saved');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Could not save the product'),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/products/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

// --- Orders ----------------------------------------------------------------

export function useOrders(role: 'buyer' | 'merchant' | 'admin', status?: OrderStatus) {
  return useQuery({
    queryKey: ['orders', role, status ?? 'all'],
    queryFn: async () => {
      const qs = new URLSearchParams({ role });
      if (status) qs.set('status', status);
      const res = await api.get<ApiResponse<Order[]>>(`/orders?${qs.toString()}`);
      return res.data.data;
    },
  });
}

export type OrderAction = 'accept' | 'prepare' | 'ship' | 'deliver' | 'confirm' | 'cancel';

export function useOrderAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, action }: { id: string; action: OrderAction }) => {
      const res = await api.post<ApiResponse<Order>>(`/orders/${id}/${action}`);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Action failed'),
  });
}

export function useResolveDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, resolution, note }: { id: string; resolution: 'refunded' | 'released'; note?: string }) => {
      const res = await api.post<ApiResponse<Order>>(`/orders/${id}/resolve`, { resolution, note });
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Dispute resolved');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Could not resolve'),
  });
}

/** The merchant's next lifecycle action for a given order status (if any). */
export function merchantNextAction(status: OrderStatus): OrderAction | null {
  switch (status) {
    case 'paid':
      return 'accept';
    case 'accepted':
      return 'prepare';
    case 'preparing':
      return 'ship';
    case 'shipped':
      return 'deliver';
    default:
      return null;
  }
}
