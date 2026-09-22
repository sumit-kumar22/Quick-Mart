export const deliveryPartners = [
  { id: 'dp-1', name: 'Ajay Kumar', phone: '+91 98111 00001', vehicle: 'Honda Activa', vehicleNumber: 'MH-01-AB-1234', rating: 4.8, online: true, assignedOrder: 'ord-1002', earningsToday: 480, earningsTotal: 43800, deliveriesToday: 12, deliveriesTotal: 1240, storeId: 'st-1' },
  { id: 'dp-2', name: 'Ramesh Yadav', phone: '+91 98111 00002', vehicle: 'TVS iQube', vehicleNumber: 'WB-02-CC-5678', rating: 4.6, online: true, assignedOrder: 'ord-1006', earningsToday: 350, earningsTotal: 32900, deliveriesToday: 9, deliveriesTotal: 980, storeId: 'st-2' },
  { id: 'dp-3', name: 'Suresh Patil', phone: '+91 98111 00003', vehicle: 'Hero Splendor', vehicleNumber: 'MH-04-DD-9012', rating: 4.4, online: false, assignedOrder: null, earningsToday: 0, earningsTotal: 25100, deliveriesToday: 0, deliveriesTotal: 750, storeId: 'st-1' },
  { id: 'dp-4', name: 'Dinesh Nair', phone: '+91 98111 00004', vehicle: 'Ola S1', vehicleNumber: 'WB-05-EE-3456', rating: 4.1, online: false, assignedOrder: null, earningsToday: 0, earningsTotal: 9800, deliveriesToday: 0, deliveriesTotal: 320, storeId: 'st-3' },
];

export const deliveryAssignments = {
  'ord-1002': {
    partnerId: 'dp-1',
    storeId: 'st-1',
    pickupDone: false,
    status: 'OUT_FOR_DELIVERY',
    otp: '482913',
    route: [
      { stage: 'Accepted', time: '09:20 AM' },
      { stage: 'Picked up from store', time: '09:35 AM' },
      { stage: 'Out for delivery', time: '09:40 AM' },
    ],
  },
  'ord-1006': {
    partnerId: 'dp-2',
    storeId: 'st-2',
    pickupDone: false,
    status: 'ASSIGNED',
    otp: '715520',
    route: [{ stage: 'Assignment received', time: '12:05 PM' }],
  },
};

export function getDeliveryPartnerById(id) {
  return deliveryPartners.find((d) => d.id === id);
}

export default deliveryPartners;