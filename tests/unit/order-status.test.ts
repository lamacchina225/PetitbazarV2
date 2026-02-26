import { describe, expect, it } from 'vitest';
import { OrderStatus } from '@prisma/client';
import { canTransition, isVisibleToClient } from '@/lib/order-status';

describe('order status machine', () => {
  it('accepts valid transition', () => {
    expect(canTransition(OrderStatus.PENDING_PAYMENT, OrderStatus.PAYMENT_CONFIRMED)).toBe(true);
  });

  it('rejects invalid transition', () => {
    expect(canTransition(OrderStatus.PENDING_PAYMENT, OrderStatus.DELIVERED)).toBe(false);
  });

  it('hides internal statuses', () => {
    expect(isVisibleToClient(OrderStatus.ORDERED_FROM_SUPPLIER)).toBe(false);
    expect(isVisibleToClient(OrderStatus.IN_DELIVERY)).toBe(true);
  });
});
