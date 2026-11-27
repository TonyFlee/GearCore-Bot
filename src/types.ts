export type StoreProduct = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  price: number;
  sale_price: number | null;
  image_url: string | null;
  stock: number;
  category: string | null;
  preorder_enabled: boolean | null;
  preorder_lead_days: number | null;
  archived: boolean | null;
  featured: boolean | null;
  created_at: string | null;
};
