export const notifications = [
  { id: 'nt-1', userId: 'u-1', type: 'order', title: 'Order confirmed', body: 'Your order #ord-1002 has been confirmed and is being prepared.', date: '2026-09-18T09:08:00', read: false, link: '/track-order/ord-1002' },
  { id: 'nt-2', userId: 'u-1', type: 'order', title: 'Delivery partner assigned', body: 'Ajay Kumar will deliver your order #ord-1002.', date: '2026-09-18T09:20:00', read: false, link: '/track-order/ord-1002' },
  { id: 'nt-3', userId: 'u-1', type: 'offer', title: 'Weekend special offer', body: 'Flat 20% off on snacks & munchies. Use code SNACK20.', date: '2026-09-17T19:00:00', read: false, link: '/coupons' },
  { id: 'nt-4', userId: 'u-1', type: 'order', title: 'Order delivered', body: 'Your order #ord-1001 was delivered successfully. Rate your products!', date: '2026-09-12T10:50:00', read: true, link: '/orders/ord-1001' },
  { id: 'nt-5', userId: 'u-1', type: 'wallet', title: 'Refund processed', body: 'Refund of ₹494 for order #ord-1005 has been processed to your account.', date: '2026-07-23T09:30:00', read: true, link: '/orders/ord-1005' },
];

export const adminNotifications = [
  { id: 'an-1', type: 'order', title: 'New order received', body: 'Order #ord-1007 received at New Town store.', date: '2026-09-18T12:15:00', read: false },
  { id: 'an-2', type: 'stock', title: 'Low stock alert', body: 'Broccoli Crowns stock is below threshold at MG Road.', date: '2026-09-18T11:00:00', read: false },
  { id: 'an-3', type: 'order', title: 'Order out for delivery', body: 'Order #ord-1002 is out for delivery.', date: '2026-09-18T10:30:00', read: true },
];

export default notifications;