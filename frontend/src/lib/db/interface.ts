export interface Product {
  id?: string;
  title: string;
  price: number;
  imageUrl?: string;
  entityType: 'Service' | 'BazaarItem';
  creatorName?: string;
  creatorId?: string;
  category?: string;
  theme?: string;
  status?: string;
  description?: string;
  keywords?: string[];
  [key: string]: any;
}

export interface CustomRequest {
  id?: string;
  creatorId: string;
  title: string;
  description: string;
  budget: number;
  status: string;
  createdAt?: any;
  [key: string]: any;
}

export interface Bounty {
  id?: string;
  title: string;
  description: string;
  reward: number;
  status: string;
  createdAt?: any;
  [key: string]: any;
}

export interface CreatorApplication {
  id?: string;
  uid: string;
  username: string;
  email: string;
  artworks: string[];
  status?: string;
  tier?: number;
  createdAt?: any;
}

export interface DatabaseService {
  // Products
  getProducts(typeParam: string): Promise<Product[]>;
  addProduct(product: Product): Promise<string>;
  updateProduct(id: string, product: Partial<Product>): Promise<void>;
  deleteProduct(id: string): Promise<void>;

  // Custom Requests
  getCustomRequests(): Promise<CustomRequest[]>;
  addCustomRequest(request: CustomRequest): Promise<string>;
  updateCustomRequest(id: string, request: Partial<CustomRequest>): Promise<void>;

  // Bounties
  getBounties(): Promise<Bounty[]>;
  addBounty(bounty: Bounty): Promise<string>;
  updateBounty(id: string, bounty: Partial<Bounty>): Promise<void>;

  // Applications
  getApplications(): Promise<CreatorApplication[]>;
  addApplication(app: CreatorApplication): Promise<string>;
  updateApplicationStatus(id: string, status: string, tier?: number, uid?: string): Promise<void>;
}
