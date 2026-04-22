import { Component, OnInit } from '@angular/core'
import { finalize } from 'rxjs'
import { AdminProduct } from '../../models/admin.models'
import { AdminDashboardService } from '../../services/admin-dashboard.service'
import { AdminToastService } from '../../services/admin-toast.service'

type ProductStatusFilter = 'All' | 'Pending' | 'Accepted' | 'Rejected'

@Component({
  selector: 'app-manage-products',
  templateUrl: './manage-products.component.html',
  styleUrl: './manage-products.component.css'
})
export class ManageProductsComponent implements OnInit {
  readonly statusFilters: ReadonlyArray<ProductStatusFilter> = [
    'All',
    'Pending',
    'Accepted',
    'Rejected'
  ]

  products: AdminProduct[] = []
  selectedStatus: ProductStatusFilter = 'All'
  searchTerm = ''
  pageSize = 10
  currentPage = 1
  isLoading = false
  errorMessage: string | null = null
  processingProductId: string | null = null
  previewImage: string | null = null

  constructor (
    private readonly adminDashboardService: AdminDashboardService,
    private readonly toastService: AdminToastService
  ) {}

  ngOnInit (): void {
    this.loadProducts()
  }

  get searchedProducts (): AdminProduct[] {
    const value = this.searchTerm.trim().toLowerCase()
    if (!value) {
      return this.products
    }
    return this.products.filter(
      product =>
        product.productName.toLowerCase().includes(value) ||
        product.categoryId.toLowerCase().includes(value) ||
        product.sellerId.toLowerCase().includes(value)
    )
  }
 

  get filteredProducts (): AdminProduct[] {
    if (this.selectedStatus === 'All') {
      return this.searchedProducts
    }
    return this.searchedProducts.filter(
      product =>
        this.adminDashboardService.getProductStatusText(product.status) ===
        this.selectedStatus
    )
  }

  get pagedProducts (): AdminProduct[] {
    const start = (this.currentPage - 1) * this.pageSize
    return this.filteredProducts.slice(start, start + this.pageSize)
  }

  get totalPages (): number {
    return Math.max(1, Math.ceil(this.filteredProducts.length / this.pageSize))
  }

  loadProducts (forceRefresh = true): void {
    this.isLoading = true
    this.errorMessage = null

    this.adminDashboardService
      .getProducts(forceRefresh)
      .pipe(
        finalize(() => {
          this.isLoading = false
        })
      )
      .subscribe({
        next: products => {
          this.products = products
          this.ensureValidPage()
        },
        error: error => {
          this.errorMessage =
            error?.error?.message ||
            error?.message ||
            'Unable to load products right now.'
        }
      })
  }

  setStatusFilter (filter: ProductStatusFilter): void {
    this.selectedStatus = filter
    this.currentPage = 1
  }

  onSearchChange (): void {
    this.currentPage = 1
  }

  changePage (direction: -1 | 1): void {
    this.currentPage = Math.min(
      this.totalPages,
      Math.max(1, this.currentPage + direction)
    )
  }

  acceptProduct (product: AdminProduct): void {
    this.runProductAction(product, 1, 'Product accepted successfully.')
  }

  rejectProduct (product: AdminProduct): void {
    this.runProductAction(product, 2, 'Product rejected successfully.')
  }

  getStatusCount (status: ProductStatusFilter): number {
    if (status === 'All') {
      return this.products.length
    }
    return this.products.filter(
      product =>
        this.adminDashboardService.getProductStatusText(product.status) ===
        status
    ).length
  }

  getStatusClasses (statusCode: 0 | 1 | 2): string {
    const status = this.adminDashboardService.getProductStatusText(statusCode)
    switch (status) {
      case 'Accepted':
        return 'bg-emerald-100 text-emerald-700'
      case 'Rejected':
        return 'bg-rose-100 text-rose-700'
      default:
        return 'bg-amber-100 text-amber-800'
    }
  }

  getStatusText (product: AdminProduct): 'Pending' | 'Accepted' | 'Rejected' {
    return this.adminDashboardService.getProductStatusText(product.status)
  }

  openImagePreview (imageUrl: string): void {
    this.previewImage = imageUrl
  }

  closeImagePreview (): void {
    this.previewImage = null
  }

  trackByProductId (_index: number, product: AdminProduct): string {
    return product.id
  }

  private runProductAction (
    product: AdminProduct,
    nextStatus: 1 | 2,
    successMessage: string
  ): void {
    this.processingProductId = product.id
    this.errorMessage = null

    this.adminDashboardService
      .updateProductStatus(product.id, nextStatus)
      .pipe(
        finalize(() => {
          this.processingProductId = null
        })
      )
      .subscribe({
        next: () => {
          this.toastService.success(successMessage)
          this.loadProducts(true)
        },
        error: error => {
          const message =
            error?.error?.message ||
            error?.message ||
            'Unable to update product status.'
          this.toastService.error(message)
        }
      })
  }

  private ensureValidPage (): void {
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages
    }
  }
}
