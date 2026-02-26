# Documentation des API Endpoints

## Authentication Endpoints

### Register
- **POST** `/api/auth/register`
- **Body**: `{ firstName, lastName, email, phone, password, city, commune }`
- **Response**: `{ message, user }`

### Login
- **POST** `/api/auth/login` (via NextAuth)
- **Credentials**: `{ email, password }`

### Logout
- **POST** `/api/auth/signout` (via NextAuth)

## Cart Endpoints

### Get Cart
- **GET** `/api/cart`
- **Auth**: Required
- **Response**: `{ items: CartItem[] }`

### Add to Cart
- **POST** `/api/cart`
- **Auth**: Required
- **Body**: `{ productId, quantity }`
- **Response**: `CartItem`

### Update Cart Item
- **PUT** `/api/cart`
- **Auth**: Required
- **Body**: `{ productId, quantity }`
- **Response**: `CartItem`

### Remove from Cart
- **DELETE** `/api/cart/[productId]`
- **Auth**: Required
- **Response**: `{ message }`

## Order Endpoints

### Get Orders
- **GET** `/api/orders`
- **Auth**: Required
- **Query**: `?status=PENDING&page=1&limit=20`
- **Response**: `{ orders: Order[], total }`

### Create Order
- **POST** `/api/orders`
- **Auth**: Required
- **Body**: `{ deliveryCity, deliveryCommune, deliveryAddress, deliveryPhone, paymentMethod }`
- **Response**: `{ order: Order, paymentUrl? }`

### Get Order Details
- **GET** `/api/orders/[orderId]`
- **Auth**: Required
- **Response**: `Order`

### Update Order Status (Admin)
- **PUT** `/api/orders/[orderId]/status`
- **Auth**: Required (ADMIN only)
- **Body**: `{ status, notes }`
- **Response**: `Order`

## Product Endpoints

### List Products
- **GET** `/api/products`
- **Query**: `?search=&category=&limit=50&page=1`
- **Response**: `{ products: Product[], total }`

### Get Product Details
- **GET** `/api/products/[productId]`
- **Response**: `Product`

### Create Product (Admin)
- **POST** `/api/products`
- **Auth**: Required (ADMIN only)
- **Body**: `{ name, description, originalPrice, salePrice, cost, ... }`
- **Response**: `Product`

### Update Product (Admin)
- **PUT** `/api/products/[productId]`
- **Auth**: Required (ADMIN only)
- **Body**: `ProductUpdate`
- **Response**: `Product`

### Delete Product (Admin)
- **DELETE** `/api/products/[productId]`
- **Auth**: Required (ADMIN only)
- **Response**: `{ message }`

## Payment Endpoints

### Initialize Stripe Payment
- **POST** `/api/payments/stripe/create-intent`
- **Auth**: Required
- **Body**: `{ amount, currency, orderId }`
- **Response**: `{ clientSecret, paymentIntentId }`

### Confirm Stripe Payment
- **POST** `/api/payments/stripe/confirm`
- **Auth**: Required
- **Body**: `{ paymentIntentId, paymentMethodId }`
- **Response**: `{ success, status }`

### Initialize Cinetpay Payment
- **POST** `/api/payments/cinetpay/create`
- **Auth**: Required
- **Body**: `{ orderId, amount, description }`
- **Response**: `{ paymentUrl, transactionId }`

### Check Cinetpay Status
- **GET** `/api/payments/cinetpay/status/[transactionId]`
- **Response**: `{ status, amount, currency }`

## Admin Endpoints

### Get Dashboard Stats
- **GET** `/api/admin/stats`
- **Auth**: Required (ADMIN only)
- **Response**: `{ totalOrders, totalRevenue, totalUsers, pendingOrders }`

### List All Orders
- **GET** `/api/admin/orders`
- **Auth**: Required (ADMIN only)
- **Query**: `?status=&page=1&limit=50`
- **Response**: `{ orders: Order[], total }`

### Create Supplier Order
- **POST** `/api/admin/supplier-orders`
- **Auth**: Required (ADMIN only)
- **Body**: `{ supplierId, orderIds, notes }`
- **Response**: `SupplierOrder`

### Create Shipment to Abidjan
- **POST** `/api/admin/shipments`
- **Auth**: Required (ADMIN only)
- **Body**: `{ orderIds, carrier, trackingNumber }`
- **Response**: `ShipmentToAbidjan`

### List Shipments
- **GET** `/api/admin/shipments`
- **Auth**: Required (ADMIN only)
- **Query**: `?status=SENT_TO_ABIDJAN`
- **Response**: `{ shipments: ShipmentToAbidjan[] }`

### Create Gestionnaire Account
- **POST** `/api/admin/gestionnaires`
- **Auth**: Required (ADMIN only)
- **Body**: `{ firstName, lastName, email, phone, city, commune }`
- **Response**: `User`

## Gestionnaire Endpoints

### Get Shipments
- **GET** `/api/gestionnaire/shipments`
- **Auth**: Required (GESTIONNAIRE only)
- **Response**: `{ shipments: ShipmentToAbidjan[] }`

### Update Shipment Status
- **PUT** `/api/gestionnaire/shipments/[shipmentId]`
- **Auth**: Required (GESTIONNAIRE only)
- **Body**: `{ status, notes }`
- **Response**: `ShipmentToAbidjan`

### Get Orders to Deliver
- **GET** `/api/gestionnaire/orders`
- **Auth**: Required (GESTIONNAIRE only)
- **Query**: `?status=IN_PREPARATION`
- **Response**: `{ orders: Order[] }`

### Update Order for Delivery
- **PUT** `/api/gestionnaire/orders/[orderId]`
- **Auth**: Required (GESTIONNAIRE only)
- **Body**: `{ status, deliveryAddress, deliveryPhone }`
- **Response**: `Order`

## Webhook Endpoints

### Stripe Webhook
- **POST** `/api/webhooks/stripe`
- **Headers**: `stripe-signature`
- **Events**: 
  - `payment_intent.succeeded` → Update order status
  - `payment_intent.payment_failed` → Send failure notification

### Cinetpay Webhook
- **POST** `/api/webhooks/cinetpay`
- **Body**: `{ transaction_id, status, amount, ... }`
- **Events**: 
  - Payment successful → Update order status
  - Payment failed → Send failure notification

### Cinetpay Callback
- **GET** `/api/cinetpay/callback`
- **Query**: `?transaction_id=&status=`
- **Redirect**: To order confirmation page

## Error Responses

All endpoints return consistent error responses:
```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "data": {}
}
```

## Authentication

All protected endpoints require:
- Valid session (via NextAuth)
- User must be logged in
- Some endpoints require specific roles (ADMIN, GESTIONNAIRE)

## Rate Limiting

API endpoints have rate limiting:
- 100 requests per minute per IP for public endpoints
- 1000 requests per minute per user for authenticated endpoints

## Pagination

List endpoints support pagination:
- `limit`: Default 20, max 100
- `page`: Default 1
- Response includes `total` count
