import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface PurchaseItem {
  name: string;
  quantity: number;
  unit_price: number;
}

export interface PurchaseRecord {
  id: string;
  merchant: string;
  campaign: string;
  outlet: { name: string; city: string; address: string } | null;
  purchase_amount: number;
  discount_amount: number;
  final_amount: number;
  tokens: number;
  items: PurchaseItem[];
  receipt_no: string;
  date: string;
}

/** The signed-in customer's completed purchases (Area 3). */
export function usePurchaseHistory() {
  return useQuery({
    queryKey: ['purchaseHistory'],
    queryFn: async (): Promise<PurchaseRecord[]> => {
      const res = await api.get('/redemption/history', { params: { limit: 50 } });
      return res.data.data || [];
    },
    staleTime: 60 * 1000,
  });
}
