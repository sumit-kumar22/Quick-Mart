export const ORDER_STATUS = {
  PENDING: { label: 'Pending', color: 'slate', icon: 'clock' },
  CONFIRMED: { label: 'Confirmed', color: 'blue', icon: 'check' },
  PAYMENT_PENDING: { label: 'Payment Pending', color: 'amber', icon: 'clock' },
  PAYMENT_CONFIRMED: { label: 'Payment Confirmed', color: 'blue', icon: 'credit' },
  PREPARING: { label: 'Preparing', color: 'violet', icon: 'cooking' },
  READY_FOR_PICKUP: { label: 'Ready for pickup', color: 'violet', icon: 'bag' },
  ASSIGNED: { label: 'Delivery Assigned', color: 'indigo', icon: 'user' },
  PICKED_UP: { label: 'Picked Up', color: 'indigo', icon: 'bike' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'cyan', icon: 'truck' },
  ARRIVING: { label: 'Arriving', color: 'cyan', icon: 'map-pin' },
  DELIVERED: { label: 'Delivered', color: 'green', icon: 'check' },
  CANCELLED: { label: 'Cancelled', color: 'red', icon: 'x' },
  REFUND_REQUESTED: { label: 'Refund Requested', color: 'amber', icon: 'wallet' },
  REFUNDED: { label: 'Refunded', color: 'stone', icon: 'wallet' },
  FAILED: { label: 'Failed', color: 'red', icon: 'alert' },
};

export const DELIVERY_TIMELINE = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'PICKED_UP',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

export const CATEGORY_ICONS = {
  'fruits-vegetables': 'Carrot',
  'dairy-breakfast': 'Milk',
  'snacks-munchies': 'Cookie',
  beverages: 'Wine',
  'personal-care': 'Bath',
  'home-cleaning': 'SprayCan',
  'baby-care': 'Baby',
  'pet-care': 'PawPrint',
  bakery: 'Croissant',
  'meat-seafood': 'Fish',
  stationery: 'PenTool',
  household: 'Package',
  default: 'ShoppingBasket',
};

export const PAYMENT_METHODS = ['RAZORPAY', 'STRIPE', 'COD'];

export const ORDER_ISSUES = [
  'Missing item',
  'Wrong item',
  'Damaged item',
  'Late delivery',
  'Payment issue',
  'Refund issue',
  'Account issue',
  'Other',
];

export const APP_CONFIG = {
  siteName: 'QuickMart',
  appType: 'grocery',
};