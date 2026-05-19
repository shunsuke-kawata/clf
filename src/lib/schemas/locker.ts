import { z } from "zod";

export const lockerSchema = z.object({
  name: z.string(),
  lat: z.number(),
  lng: z.number(),
  note: z.string().optional(),
  pricing: z.array(z.number().int().positive()),
});

export type LockerInput = z.infer<typeof lockerSchema>;

export type Locker = Omit<LockerInput, "name"> & {
  id: string;
  name: string | null;
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
