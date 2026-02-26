import { OrderStatus } from '@prisma/client';

export const CLIENT_VISIBLE_STATUSES: OrderStatus[] = [
  OrderStatus.PAYMENT_CONFIRMED,
  OrderStatus.IN_PREPARATION,
  OrderStatus.IN_DELIVERY,
  OrderStatus.DELIVERED,
];

const transitions: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING_PAYMENT]: [OrderStatus.PAYMENT_CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.PAYMENT_CONFIRMED]: [OrderStatus.ORDERED_FROM_SUPPLIER, OrderStatus.CANCELLED],
  [OrderStatus.ORDERED_FROM_SUPPLIER]: [OrderStatus.IN_TRANSIT_TO_ABIDJAN],
  [OrderStatus.IN_TRANSIT_TO_ABIDJAN]: [OrderStatus.RECEIVED_IN_ABIDJAN],
  [OrderStatus.RECEIVED_IN_ABIDJAN]: [OrderStatus.IN_PREPARATION],
  [OrderStatus.IN_PREPARATION]: [OrderStatus.IN_DELIVERY, OrderStatus.CANCELLED],
  [OrderStatus.IN_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REFUNDED]: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return transitions[from]?.includes(to) ?? false;
}

export function isVisibleToClient(status: OrderStatus): boolean {
  return CLIENT_VISIBLE_STATUSES.includes(status);
}

