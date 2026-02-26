# Scénarios de test

## 1. User Flow - Client

### 1.1 Registration
- [ ] Navigate to `/register`
- [ ] Fill in form: Prénom, Nom, Email, Téléphone, Ville, Commune
- [ ] Confirm password match
- [ ] Submit and verify email confirmation
- [ ] Login with new account

### 1.2 Browsing Products
- [ ] Go to `/products`
- [ ] View product catalog
- [ ] Use search bar to find products
- [ ] Filter by category
- [ ] Click on product to view details
- [ ] View product reviews and ratings

### 1.3 Shopping Cart
- [ ] Add product to cart
- [ ] View cart at `/cart`
- [ ] Modify quantity
- [ ] Remove item from cart
- [ ] Cart total updates correctly

### 1.4 Checkout
- [ ] Go to checkout
- [ ] Enter delivery address (Abidjan commune)
- [ ] Select payment method (Stripe or Cinetpay)
- [ ] Complete payment
- [ ] Receive order confirmation email

### 1.5 Order Tracking
- [ ] View order status in dashboard
- [ ] Update statuses: Pending → Confirmed → Shipped → Delivered
- [ ] Receive email notifications on status changes

## 2. Admin Flow

### 2.1 Dashboard
- [ ] Login as admin@petitbazar.ci
- [ ] View dashboard stats (orders, revenue, users, pending)
- [ ] Navigate to all admin sections

### 2.2 Product Management
- [ ] Create new product
- [ ] Edit existing product
- [ ] Delete product
- [ ] Set featured products
- [ ] Manage categories

### 2.3 Order Management
- [ ] View all orders
- [ ] View order details
- [ ] Create supplier order
- [ ] Update status: ORDERED_FROM_SUPPLIER → IN_TRANSIT_TO_ABIDJAN
- [ ] Batch orders for shipment
- [ ] Notify gestionnaire when sending to Abidjan

### 2.4 User Management
- [ ] Create new gestionnaire account
- [ ] View all users
- [ ] Edit user roles
- [ ] Delete user accounts

### 2.5 Shipment Management
- [ ] Create shipment to Abidjan
- [ ] Select multiple orders
- [ ] Generate tracking number
- [ ] Send notification to gestionnaire

## 3. Gestionnaire Flow

### 3.1 Dashboard
- [ ] Login as gestionnaire
- [ ] View shipments to Abidjan
- [ ] View orders to deliver

### 3.2 Shipment Reception
- [ ] Receive notification of new shipment
- [ ] View shipment details
- [ ] Mark shipment as received
- [ ] Check items in package

### 3.3 Order Delivery
- [ ] View orders in "In Preparation"
- [ ] Mark order as "In Delivery"
- [ ] Update address for delivery
- [ ] Mark order as "Delivered"
- [ ] Customer receives delivery notification

## 4. Payment Tests

### 4.1 Stripe Payment
- [ ] Use test card: 4242 4242 4242 4242
- [ ] Enter future expiry date
- [ ] Enter any CVC
- [ ] Verify payment success
- [ ] Check order status updated

### 4.2 Cinetpay Payment
- [ ] Select Cinetpay at checkout
- [ ] Choose Wave or Orange Money
- [ ] Verify payment URL redirects
- [ ] Test callback/webhook
- [ ] Verify order status updated

## 5. Email Tests

### 5.1 Notification Emails
- [ ] Registration confirmation
- [ ] Order confirmation
- [ ] Payment confirmation
- [ ] Shipment notification (admin to gestionnaire)
- [ ] Delivery notification
- [ ] Admin notification of new order

## 6. Search & Filter Tests

### 6.1 Product Search
- [ ] Search by name
- [ ] Search by description
- [ ] Filter by category
- [ ] Sort by price
- [ ] Sort by rating
- [ ] Pagination works correctly

## 7. Responsive Design Tests

### 7.1 Mobile (< 768px)
- [ ] Navbar collapses to hamburger menu
- [ ] Product grid becomes single column
- [ ] Forms stack vertically
- [ ] All touch targets > 44px
- [ ] Images scale appropriately

### 7.2 Tablet (768px - 1024px)
- [ ] Layout adjusts to tablet size
- [ ] Product grid shows 2 columns
- [ ] Navigation visible

### 7.3 Desktop (> 1024px)
- [ ] Full layout with sidebars
- [ ] Product grid shows 4 columns
- [ ] All features visible

## 8. Security Tests

### 8.1 Authentication
- [ ] Cannot access admin without login
- [ ] Cannot access gestionnaire without role
- [ ] Session expires after 30 days
- [ ] Password reset works with token

### 8.2 Authorization
- [ ] Client can only see own orders
- [ ] Gestionnaire can only see assigned shipments
- [ ] Admin can access everything

### 8.3 API Security
- [ ] API requires authentication
- [ ] Rate limiting on endpoints
- [ ] CSRF protection on forms

## 9. Performance Tests

### 9.1 Load Times
- [ ] Homepage < 3s
- [ ] Product page < 2s
- [ ] Admin dashboard < 2s

### 9.2 Image Optimization
- [ ] Images lazy-loaded
- [ ] Responsive image sizes
- [ ] WebP format used when available

## 10. Data Integrity Tests

### 10.1 Database
- [ ] Foreign key constraints work
- [ ] Unique constraints work
- [ ] Default values applied

### 10.2 Calculations
- [ ] Prices calculated correctly
- [ ] Shipping cost added correctly
- [ ] Tax calculated correctly
- [ ] Order total correct
