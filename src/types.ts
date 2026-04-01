export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'customer' | 'admin';
}

export interface Car {
  id: string;
  model: string;
  price: number;
  description: string;
  image: string;
  specs?: Record<string, string>;
}

export interface Booking {
  id: string;
  userId: string;
  carId: string;
  status: 'pending' | 'confirmed' | 'delivered' | 'delayed';
  amount: number;
  deliveryDate?: string;
  deliveryTime?: string;
  notes?: string;
  createdAt: string;
}
