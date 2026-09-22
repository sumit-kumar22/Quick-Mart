export const users = [
  { id: 'u-1', name: 'Aarav Mehta', email: 'aarav@example.com', phone: '+91 98765 00001', role: 'CUSTOMER', status: 'active', createdAt: '2026-02-11', orders: 24, spent: 12450.5, address: 'Mumbai', avatar: null },
  { id: 'u-2', name: 'Ishita Roy', email: 'ishita@example.com', phone: '+91 98765 00002', role: 'CUSTOMER', status: 'active', createdAt: '2026-03-05', orders: 18, spent: 9210.0, address: 'Kolkata', avatar: null },
  { id: 'u-3', name: 'Vikram Singh', email: 'vikram@example.com', phone: '+91 98765 00003', role: 'CUSTOMER', status: 'active', createdAt: '2026-04-18', orders: 9, spent: 4875.25, address: 'Hyderabad', avatar: null },
  { id: 'u-4', name: 'Sneha Gupta', email: 'sneha@example.com', phone: '+91 98765 00004', role: 'CUSTOMER', status: 'suspended', createdAt: '2026-05-02', orders: 3, spent: 1540.0, address: 'Delhi', avatar: null },
  { id: 'u-5', name: 'Rohan Das', email: 'rohan@example.com', phone: '+91 98765 00005', role: 'CUSTOMER', status: 'active', createdAt: '2026-06-21', orders: 41, spent: 22100.75, address: 'Kolkata', avatar: null },
  { id: 'u-6', name: 'Meera Nair', email: 'meera@example.com', phone: '+91 98765 00006', role: 'CUSTOMER', status: 'active', createdAt: '2026-07-15', orders: 12, spent: 6380.4, address: 'Chennai', avatar: null },
  { id: 'u-7', name: 'Kabir Khan', email: 'kabir@example.com', phone: '+91 98765 00007', role: 'CUSTOMER', status: 'blocked', createdAt: '2026-08-01', orders: 1, spent: 240.0, address: 'Pune', avatar: null },
];

export const currentUser = {
  id: 'u-1',
  name: 'Aarav Mehta',
  email: 'aarav@example.com',
  phone: '+91 98765 00001',
  role: 'CUSTOMER',
  status: 'active',
  createdAt: '2026-02-11',
  avatar: null,
  addresses: [
    {
      id: 'ad-1',
      label: 'Home',
      type: 'home',
      name: 'Aarav Mehta',
      phone: '+91 98765 00001',
      line1: 'B-402, Sunshine Apartments',
      line2: 'Veera Desai Road',
      landmark: 'Near Metro Station',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400053',
      latitude: 19.1304,
      longitude: 72.8224,
      isDefault: true,
    },
    {
      id: 'ad-2',
      label: 'Work',
      type: 'work',
      name: 'Aarav Mehta',
      phone: '+91 98765 00001',
      line1: '12th Floor, Tech Tower',
      line2: 'BKC, Bandra East',
      landmark: 'Opposite Bank',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400051',
      latitude: 19.0625,
      longitude: 72.8369,
      isDefault: false,
    },
  ],
  orders: ['ord-1001', 'ord-1002', 'ord-1003', 'ord-1004', 'ord-1005'],
  wishlist: ['p007', 'p042', 'p063', 'p009'],
  coupons: ['cp-1', 'cp-2'],
};

export const deliveryPartners = [
  { id: 'dp-1', name: 'Ajay Kumar', phone: '+91 98111 00001', email: 'ajay@quickmart.co', vehicle: 'Honda Activa', vehicleNumber: 'MH-01-AB-1234', status: 'active', online: true, rating: 4.8, completed: 1240, earnings: 43800, storeId: 'st-1', currentOrder: 'ord-1002', joinedAt: '2026-01-20' },
  { id: 'dp-2', name: 'Ramesh Yadav', phone: '+91 98111 00002', email: 'ramesh@quickmart.co', vehicle: 'TVS iQube', vehicleNumber: 'WB-02-CC-5678', status: 'active', online: true, rating: 4.6, completed: 980, earnings: 32900, storeId: 'st-2', currentOrder: 'ord-1006', joinedAt: '2026-02-14' },
  { id: 'dp-3', name: 'Suresh Patil', phone: '+91 98111 00003', email: 'suresh@quickmart.co', vehicle: 'Hero Splendor', vehicleNumber: 'MH-04-DD-9012', status: 'active', online: false, rating: 4.4, completed: 750, earnings: 25100, storeId: 'st-1', currentOrder: null, joinedAt: '2026-03-01' },
  { id: 'dp-4', name: 'Dinesh Nair', phone: '+91 98111 00004', email: 'dinesh@quickmart.co', vehicle: 'Ola S1', vehicleNumber: 'WB-05-EE-3456', status: 'inactive', online: false, rating: 4.1, completed: 320, earnings: 9800, storeId: 'st-3', currentOrder: null, joinedAt: '2026-05-11' },
];

export default users;