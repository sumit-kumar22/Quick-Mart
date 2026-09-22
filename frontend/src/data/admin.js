export const adminAnalytics = {
  today: {
    orders: 142,
    revenue: 41250,
    activeUsers: 321,
    pendingOrders: 18,
    deliveredOrders: 86,
    cancelledOrders: 7,
    lowStockProducts: 5,
  },
  salesChart: [
    { day: '12 Sep', orders: 96, revenue: 28500 },
    { day: '13 Sep', orders: 112, revenue: 33200 },
    { day: '14 Sep', orders: 105, revenue: 30150 },
    { day: '15 Sep', orders: 128, revenue: 38400 },
    { day: '16 Sep', orders: 133, revenue: 39600 },
    { day: '17 Sep', orders: 121, revenue: 35900 },
    { day: '18 Sep', orders: 142, revenue: 41250 },
  ],
  orderStatusDistribution: [
    { name: 'Delivered', value: 86 },
    { name: 'Preparing', value: 22 },
    { name: 'Out for Delivery', value: 15 },
    { name: 'Pending', value: 18 },
    { name: 'Cancelled', value: 7 },
  ],
  topProducts: [
    { name: 'Pure Cow Milk', units: 342, revenue: 16416 },
    { name: 'Farm Eggs', units: 210, revenue: 19320 },
    { name: 'Red Apple Shimla', units: 156, revenue: 29484 },
    { name: 'Chocolate Cookies', units: 148, revenue: 7252 },
    { name: 'Fresh Farm Tomato', units: 132, revenue: 6072 },
  ],
  topCategories: [
    { name: 'Dairy & Breakfast', revenue: 48620 },
    { name: 'Fruits & Vegetables', revenue: 39210 },
    { name: 'Bakery', revenue: 21540 },
    { name: 'Snacks & Munchies', revenue: 18980 },
    { name: 'Beverages', revenue: 14260 },
  ],
  storePerformance: [
    { name: 'MG Road', orders: 142, revenue: 41250 },
    { name: 'Salt Lake', orders: 118, revenue: 33920 },
    { name: 'Howrah', orders: 76, revenue: 21840 },
    { name: 'New Town', orders: 160, revenue: 46520 },
  ],
  deliveryPerformance: {
    avgDeliveryMinutes: 28,
    onTimeRate: 94,
    activePartners: 42,
    deliveriesToday: 496,
  },
};

export const recentOrders = [
  { id: 'ord-1012', customer: 'Riya Sharma', amount: 486, status: 'PENDING', time: '2 min ago' },
  { id: 'ord-1011', customer: 'Aditya Verma', amount: 1230, status: 'CONFIRMED', time: '9 min ago' },
  { id: 'ord-1010', customer: 'Sneha Gupta', amount: 82, status: 'DELIVERED', time: '28 min ago' },
  { id: 'ord-1009', customer: 'Meera Nair', amount: 246, status: 'PREPARING', time: '41 min ago' },
  { id: 'ord-1008', customer: 'Vikram Singh', amount: 428, status: 'DELIVERED', time: '1 hr ago' },
];

export const auditLogs = [
  { id: 'al-1', admin: 'Priya Banerjee', action: 'UPDATED_ORDER_STATUS', detail: 'Changed order ord-1006 to ASSIGNED', date: '2026-09-18T12:04:00', ip: '192.168.1.24' },
  { id: 'al-2', admin: 'Rahul Sharma', action: 'PRODUCT_CREATED', detail: 'Created product Paneer Fresh', date: '2026-09-18T11:30:00', ip: '192.168.1.15' },
  { id: 'al-3', admin: 'SuperAdmin', action: 'STORE_UPDATED', detail: 'Deactivated QuickMart Durgapur', date: '2026-09-18T10:12:00', ip: '10.0.0.5' },
  { id: 'al-4', admin: 'Ananya Sen', action: 'USER_SUSPENDED', detail: 'Suspended user Sneha Gupta', date: '2026-09-17T16:45:00', ip: '192.168.1.102' },
];

export default adminAnalytics;