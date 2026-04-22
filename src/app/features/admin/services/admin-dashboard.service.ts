import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, forkJoin, map, of, tap } from 'rxjs';
import { ResponseModel } from '../../../core/Interfaces/response-model';
import { API_BASE_URL } from '../../../core/config/api-base';
import {
  AdminCustomer,
  AdminDashboardSummary,
  AdminProduct,
  AdminProductStatusCode,
  AdminSeller
} from '../models/admin.models';
import { ProductStatus } from '../pages/pending-products/product.enum';

@Injectable({
  providedIn: 'root'
})
export class AdminDashboardService {
  private readonly adminApiUrl = `${API_BASE_URL}/Admin`;
  private customersCache: AdminCustomer[] | null = null;
  private sellersCache: AdminSeller[] | null = null;
  private productsCache: AdminProduct[] | null = null;

  constructor(private readonly http: HttpClient) {}

  getCustomers(forceRefresh = false): Observable<AdminCustomer[]> {
    if (!forceRefresh && this.customersCache) {
      return of(this.customersCache);
    }

    return this.http
      .get<ResponseModel<unknown[]>>(`${this.adminApiUrl}/customers`)
      .pipe(
        map((response) => this.extractData(response)),
        map((customers) => customers.map((item) => this.mapUser(item))),
        tap((customers) => (this.customersCache = customers))
      );
  }

  getSellers(forceRefresh = false): Observable<AdminSeller[]> {
    if (!forceRefresh && this.sellersCache) {
      return of(this.sellersCache);
    }

    return this.http
      .get<ResponseModel<unknown[]>>(`${this.adminApiUrl}/sellers`)
      .pipe(
        map((response) => this.extractData(response)),
        map((sellers) => sellers.map((item) => this.mapUser(item))),
        tap((sellers) => (this.sellersCache = sellers))
      );
  }

  getProducts(forceRefresh = false): Observable<AdminProduct[]> {
    if (!forceRefresh && this.productsCache) {
      return of(this.productsCache);
    }

    return this.http
      .get<ResponseModel<unknown[]>>(`${this.adminApiUrl}/products`)
      .pipe(
        map((response) => this.extractData(response)),
        map((products) => products.map((item) => this.mapProduct(item))),
        tap((products) => (this.productsCache = products))
      );
  }

  getPendingProducts(forceRefresh = false): Observable<AdminProduct[]> {
    return this.getProducts(forceRefresh).pipe(
      map((products) => products.filter((product) => product.status === 0))
    );
  }

  toggleUserStatus(userId: string): Observable<boolean> {
    return this.http
      .put<ResponseModel<boolean>>(`${this.adminApiUrl}/user/${userId}/toggleStatus`, {})
      .pipe(
        map((response) => this.extractData(response)),
        tap(() => this.invalidateUsersCache())
      );
  }



  updateProductStatus(productId: string, status: ProductStatus): Observable<boolean> {
    console.log(`Updating product ${productId} to status ${status}`);
    return this.http
      .put<ResponseModel<boolean>>(`${this.adminApiUrl}/product/${productId}/status/${status}`, {})
      .pipe(
        map((response) => this.extractData(response)),
        tap(() => (this.productsCache = null))
      );
  }

  getDashboardSummary(forceRefresh = false): Observable<AdminDashboardSummary> {
    return forkJoin({
      customers: this.getCustomers(forceRefresh),
      sellers: this.getSellers(forceRefresh),
      products: this.getProducts(forceRefresh)
    }).pipe(
      map(({ customers, sellers, products }) => ({
        totalCustomers: customers.length,
        totalSellers: sellers.length,
        totalProducts: products.length,
        pendingProducts: products.filter((product) => product.status === 0).length,
        activeCustomers: customers.filter((customer) => customer.isActive).length,
        activeSellers: sellers.filter((seller) => seller.isActive).length
      }))
    );
  }

  getProductStatusText(status: AdminProductStatusCode): 'Pending' | 'Accepted' | 'Rejected' {
    if (status === 1) {
      return 'Accepted';
    }
    if (status === 2) {
      return 'Rejected';
    }
    return 'Pending';
  }

  private invalidateUsersCache(): void {
    this.customersCache = null;
    this.sellersCache = null;
  }

  private extractData<T>(response: ResponseModel<T>): T {
    if (!response.isSuccess) {
      throw new Error(response.message || 'Request failed.');
    }
    return response.data;
  }

  private mapUser(item: any): AdminCustomer {
    const isActive = this.toBoolean(item.isActive ?? item.isDeleted === false ?? true);

    return {
      id: String(item.id ?? item.userId ?? ''),
      fullName: String(item.fullName ?? item.name ?? item.displayName ?? '-'),
      userName: String(item.userName ?? item.email ?? '-'),
      isActive,
      statusLabel: isActive ? 'Active' : 'Deleted'
    };
  }

  private mapProduct(item: any): AdminProduct {
    return {
      id: String(item.id ?? item.productId ?? ''),
      productName: String(item.productName ?? item.name ?? '-'),
      image: String(item.image ?? item.imageUrl ?? item.thumbnail ?? ''),
      price: Number(item.price ?? 0),
      stockQuantity: Number(item.stockQuantity ?? item.quantity ?? 0),
      status: this.toStatusCode(item.status),
      categoryId: String(item.categoryId ?? '-'),
      sellerId: String(item.sellerId ?? '-')
    };
  }

  private toBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'number') {
      return value > 0;
    }
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return false;
  }

  private toStatusCode(value: unknown): AdminProductStatusCode {
    const numeric = Number(value);
    if (numeric === 1 || numeric === 2) {
      return numeric;
    }
    return 0;
  }
}
