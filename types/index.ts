export type {
  User,
  Order,
  OrderItem,
  Product,
  Category,
  CartItem,
  Review,
  SupplierOrder,
  ShipmentToAbidjan,
  Notification,
  UserAddress,
  ActivityLog,
  OrderStatusHistory,
  ProductRaw,
  ImportJob,
  UserRole,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  ShipmentStatus,
  ProductStatus,
  SourcePlatform,
} from '@prisma/client';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface SessionUser {
  id: string;
  email?: string;
  name?: string;
  role: string;
  image?: string;
}
