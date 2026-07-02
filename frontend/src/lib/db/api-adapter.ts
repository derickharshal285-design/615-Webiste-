import { DatabaseService, Product, CustomRequest, Bounty } from './interface';

export class ApiAdapter implements DatabaseService {
  async getProducts(typeParam: string): Promise<Product[]> {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('Failed to fetch products');
    const data = await res.json();
    return data.filter((p: Product) => p.entityType === typeParam);
  }

  async addProduct(product: Product): Promise<string> {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    if (!res.ok) throw new Error('Failed to add product');
    const data = await res.json();
    return data.id || 'new-id';
  }

  async updateProduct(id: string, product: Partial<Product>): Promise<void> {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    if (!res.ok) throw new Error('Failed to update product');
  }

  async deleteProduct(id: string): Promise<void> {
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete product');
  }

  async getCustomRequests(): Promise<CustomRequest[]> {
    const res = await fetch('/api/requests');
    if (!res.ok) throw new Error('Failed to fetch requests');
    return await res.json();
  }

  async addCustomRequest(request: CustomRequest): Promise<string> {
    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    if (!res.ok) throw new Error('Failed to add request');
    const data = await res.json();
    return data.id || 'new-id';
  }

  async updateCustomRequest(id: string, request: Partial<CustomRequest>): Promise<void> {
    const res = await fetch(`/api/requests/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    if (!res.ok) throw new Error('Failed to update request');
  }

  async getBounties(): Promise<Bounty[]> {
    const res = await fetch('/api/bounties');
    if (!res.ok) throw new Error('Failed to fetch bounties');
    return await res.json();
  }

  async addBounty(bounty: Bounty): Promise<string> {
    const res = await fetch('/api/bounties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bounty)
    });
    if (!res.ok) throw new Error('Failed to add bounty');
    const data = await res.json();
    return data.id || 'new-id';
  }

  async updateBounty(id: string, bounty: Partial<Bounty>): Promise<void> {
    const res = await fetch(`/api/bounties/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bounty)
    });
    if (!res.ok) throw new Error('Failed to update bounty');
  }

  async getApplications(): Promise<any[]> {
    const res = await fetch('/api/applications');
    if (!res.ok) throw new Error('Failed to fetch applications');
    return await res.json();
  }

  async addApplication(app: any): Promise<string> {
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(app)
    });
    if (!res.ok) throw new Error('Failed to add application');
    const data = await res.json();
    return data.id || 'new-id';
  }

  async updateApplicationStatus(id: string, status: string, tier?: number, uid?: string): Promise<void> {
    const res = await fetch(`/api/applications/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, tier, uid })
    });
    if (!res.ok) throw new Error('Failed to update application');
  }
}
