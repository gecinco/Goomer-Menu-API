export interface ProductRow {
  id: number;
  name: string;
  priceCents: number;
  category: string;
  isVisible: boolean;
  sortOrder: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PromotionRow {
  id: number;
  productId: number;
  description: string;
  promoPriceCents: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PromotionScheduleRow {
  id: number;
  promotionId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface MenuItem {
  productId: number;
  productName: string;
  productCategory: string;
  sortOrder: number | null;
  originalPriceCents: number;
  isPromotionActive: boolean;
  promotionId: number | null;
  promotionDescription: string | null;
  finalPriceCents: number;
}
