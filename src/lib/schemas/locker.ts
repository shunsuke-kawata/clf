import { z } from "zod";

export const pricingItemSchema = z.object({
  size: z.string().min(1),
  duration: z.string().min(1),
  price: z.number().int().nonnegative(),
});

export const lockerSchema = z.object({
  name: z.string().min(1, "名称は必須です"),
  lat: z.number(),
  lng: z.number(),
  note: z.string().optional(),
  pricing: z.array(pricingItemSchema),
});

export type PricingItem = z.infer<typeof pricingItemSchema>;
export type LockerInput = z.infer<typeof lockerSchema>;

export type Locker = LockerInput & {
  id: string;
  created_at: string;
  updated_at: string;
};

export type LockerPhoto = {
  id: string;
  locker_id: string;
  storage_key: string;
  order_index: number;
  created_at: string;
};

export type LockerWithPhotos = Locker & {
  locker_photos: LockerPhoto[];
};
