import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

/** Marketplace commerce (Phase 5). Money is integer minor units (pesewas). */
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
}

export interface Order {
  id: string;
  buyer_id: string;
  merchant_id: string;
  items: { product_id: string; name: string; unit_price_minor: number; quantity: number }[];
  subtotal_minor: number;
  total_minor: number;
  currency: string;
  status: OrderStatus;
  history: { status: OrderStatus; actor: string; at: string }[];
  dispute?: { reason: string; detail: string; resolution?: string };
  created_at: string;
}

export function formatMinor(minor: number, currency = 'GHS'): string {
  const symbol = currency === 'GHS' ? 'GH₵' : `${currency} `;
  return `${symbol}${(minor / 100).toFixed(2)}`;
}

export function useProducts() {
  return useQuery({
    queryKey: ['shop', 'products'],
    queryFn: async (): Promise<Product[]> => {
      const res = await api.get('/products', { params: { limit: 50 } });
      return res.data?.data || [];
    },
    staleTime: 60 * 1000,
  });
}

export function useProduct(id?: string) {
  return useQuery({
    queryKey: ['shop', 'product', id],
    enabled: !!id,
    queryFn: async (): Promise<Product> => {
      const res = await api.get(`/products/${id}`);
      return res.data.data;
    },
  });
}

export function useMyOrders() {
  return useQuery({
    queryKey: ['orders', 'buyer'],
    queryFn: async (): Promise<Order[]> => {
      const res = await api.get('/orders', { params: { role: 'buyer' } });
      return res.data?.data || [];
    },
  });
}

export function useOrder(id?: string) {
  return useQuery({
    queryKey: ['orders', 'one', id],
    enabled: !!id,
    queryFn: async (): Promise<Order> => {
      const res = await api.get(`/orders/${id}`);
      return res.data.data;
    },
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    // A cart may span merchants; the server splits it into one order each and
    // returns them all. Single-product buys just get an array of one.
    mutationFn: async (input: {
      items: { product_id: string; quantity: number }[];
      contact: { name: string; phone: string; address: string; city: string };
    }): Promise<Order[]> => {
      const res = await api.post('/orders', input);
      return res.data?.data?.orders || [];
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
}

export interface PayResult {
  requires_payment: boolean;
  authorization_url?: string;
  reference?: string;
  status?: string;
}

export function usePayOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string): Promise<PayResult> => {
      const res = await api.post(`/orders/${orderId}/pay`);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
}

export function useOrderAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, action, body }: { id: string; action: 'confirm' | 'cancel' | 'dispute'; body?: any }) => {
      const res = await api.post(`/orders/${id}/${action}`, body || {});
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
}

export function commerceError(err: any): string {
  return err?.response?.data?.message || 'Something went wrong. Please try again.';
}
