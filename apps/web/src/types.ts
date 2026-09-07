export type Role = 'ADMIN' | 'FARMER' | 'BUYER' | 'TRANSPORTER' | 'DEALER' | 'COOPERATIVE';
export interface User { id: string; firstName: string; lastName: string; email: string; phone: string; role: Role; status: string; isVerified: boolean; }
export interface Listing { id: string; cropId: string; title: string; description: string; pricePerUnit: number; currency: string; unitType: string; availableQty: number; minimumOrderQty: number; negotiable: boolean; status: string; crop?: { name: string; variety?: string; images?: Array<{ imageUrl: string }>; farm?: { name: string } }; }
export interface Farm { id: string; name: string; address: string; sizeHectares: number; soilType?: string; status: string; _count?: { crops: number }; }
export interface Crop { id: string; farmId: string; name: string; variety?: string; plantedDate: string; estimatedHarvestDate: string; status: string; yieldEstimateQty?: number; yieldUnit?: string; }
export interface Order { id: string; totalAmount: number; currency: string; status: string; shippingAddress: string; createdAt: string; items?: Array<{ id: string; quantity: number; priceAtSale: number; listing?: Listing }> }
export interface Notification { id: string; title: string; body: string; isRead: boolean; createdAt: string; }
