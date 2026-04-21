import { ChangeDetectorRef, Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { forkJoin, finalize, of } from 'rxjs'
import { catchError } from 'rxjs/operators'
import { ResponseModel } from '../../../../core/Interfaces/response-model'
import { Category } from '../../../../core/models/category.model'
import { CategoryService } from '../../../../core/services/category.service'
import { AddProductToWhislist } from '../../../../core/models/add-product-to-whislist'
import { formatHttpError } from '../../../../core/utils/http-error.util'
import { productPictureSrc } from '../../../../core/utils/product-image.util'
import { Product, ProductFilterParams } from '../../models/product.model'
import { ProductService } from '../../services/product.service'
import { CartService } from '../../../../core/services/cart.service'
import { ReviewsService } from '../../../../core/services/reviews.service'
import { WishlistServiceService } from '../../../../core/services/wishlist-service.service'
import { AuthService } from '../../../../core/services/auth.service'
import { CartAnimationService } from '../../../../core/services/cart-animation.service'

const NO_REVIEWS_MESSAGE = 'No Reviews'

type StarKind = 'full' | 'half' | 'empty'

function clampRating (r: number): number {
  return Number.isFinite(r) ? Math.max(0, Math.min(5, r)) : 0
}

function getStars (rating: number): { kind: StarKind }[] {
  const halfSteps = Math.round(clampRating(rating) * 2)
  return Array.from({ length: 5 }, (_, i) => {
    const remaining = halfSteps - i * 2
    if (remaining >= 2) return { kind: 'full' }
    if (remaining === 1) return { kind: 'half' }
    return { kind: 'empty' }
  })
}

@Component({
  selector: 'app-product-catalog',
  templateUrl: './product-catalog.component.html',
  styleUrls: ['./product-catalog.component.scss']
})
export class ProductCatalogComponent implements OnInit {
  products: Product[] = []
  categories: Category[] = []

  loading = false
  error: string | null = null

  cartMessage: string | null = null
  cartError: string | null = null

  wishlistMessage: string | null = null
  wishlistError: string | null = null
  wishlistLoading: Record<number, boolean> = {}

  filterOpen = false
  readonly loadingSkeletons = Array.from({ length: 8 })
  /** 🔥 Single source of truth */
  filters: ProductFilterParams = {}
  wishlistState: Record<number, boolean> = {}
  private imageLoadFailed: Record<number, true> = {}

  productRatings: Record<number, any> = {}

  constructor (
    private router: Router,
    private productService: ProductService,
    private categoryService: CategoryService,
    private cartService: CartService,
    private cartAnimationService: CartAnimationService,
    private reviewsService: ReviewsService,
    private wishlistService: WishlistServiceService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit (): void {
    this.categoryService
      .getAll()
      .pipe(catchError(() => of([])))
      .subscribe(categories => {
        this.categories = categories
        this.loadProducts()
      })
  }

  // =============================
  // FILTER
  // =============================

  openFilters () {
    this.filterOpen = true
  }

  onApplyFilters (filters: ProductFilterParams) {
    this.filters = { ...filters }
    this.filterOpen = false
    this.loadProducts()
  }

  resetFilters () {
    this.filters = {}
    this.filterOpen = false
    this.loadProducts()
  }

  get activeFilters () {
    return Object.entries(this.filters)
      .filter(([_, v]) => v !== null && v !== '' && v !== undefined)
      .map(([k, v]) => ({ key: k, label: `${k}: ${v}` }))
  }

  removeActiveFilter (key: string) {
    delete this.filters[key as keyof ProductFilterParams]
    this.filters = { ...this.filters }
    this.loadProducts()
  }

  // =============================
  // PRODUCTS
  // =============================

  loadProducts () {
    this.loading = true
    this.error = null

    this.productService
      .filter(this.filters)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: rows => {
          this.products = rows
          this.imageLoadFailed = {}
          this.loadRatings(rows)
        },
        error: err =>
          (this.error = formatHttpError(err, 'Failed to load products'))
      })
  }

  // =============================
  // RATINGS
  // =============================

  private loadRatings (products: Product[]) {
    const ids = products.map(p => p.id)

    this.productRatings = Object.fromEntries(
      ids.map(id => [id, { status: 'loading' }])
    )

    forkJoin(
      ids.map(id =>
        this.reviewsService
          .getProductRating(id)
          .pipe(
            catchError(() => of({ isSuccess: false, message: '', data: 0 }))
          )
      )
    ).subscribe(responses => {
      const next = { ...this.productRatings }

      responses.forEach((res, i) => {
        const id = ids[i]
        const msg = res.message?.trim()

        if (msg === NO_REVIEWS_MESSAGE) {
          next[id] = { status: 'loaded', noReviews: true }
          return
        }

        const avg = clampRating(Number(res.data))

        next[id] = {
          status: 'loaded',
          average: avg,
          stars: getStars(avg)
        }
      })

      this.productRatings = next
      this.cdr.markForCheck()
    })
  }

  // =============================
  // IMAGE
  // =============================

  pictureSrcFor (p: Product) {
    return this.imageLoadFailed[p.id]
      ? 'assets/images/placeholder.png'
      : productPictureSrc(p.picture)
  }

  onProductImageError (p: Product) {
    this.imageLoadFailed = { ...this.imageLoadFailed, [p.id]: true }
  }

  // =============================
  // NAVIGATION
  // =============================

  goToProduct (id: number, event: MouseEvent) {
    if ((event.target as HTMLElement).closest('button')) return
    this.router.navigate(['/products', id])
  }

  // =============================
  // CART
  // =============================

  addToCart (p: Product, event: MouseEvent) {
    event.stopPropagation()

    const img = this.pictureSrcFor(p) || 'assets/images/placeholder.png'

    this.cartAnimationService.animateToCart(event, img)

    this.cartService.addItem(p.id, 1).subscribe({
      next: () => {
        this.cartMessage = `Added ${p.name}`
        this.cartError = null
      },
      error: err => {
        this.cartError = formatHttpError(err, 'Could not add to cart')
        this.cartMessage = null
      }
    })
  }
  setCategoryChip (name: string): void {
    this.filters = { ...this.filters, categoryName: name }
    this.loadProducts()
  }

  // =============================
  // WISHLIST
  // =============================

  addToWishlist (p: Product, event: Event) {
    event.stopPropagation()

    if (!this.authService.isAuthenticated()) {
      this.wishlistError = 'Login required'
      return
    }

    const user = this.authService.getSessionUser()
    const token = localStorage.getItem('token')

    if (!user || !token) return

    this.wishlistLoading[p.id] = true

    this.wishlistService
      .addToWishlist(token, {
        userId: user.userId,
        productId: p.id
      })
      .subscribe({
        next: res => {
          this.wishlistLoading[p.id] = false

          if (res.isSuccess) {
            this.wishlistState[p.id] = true // ❤️ fill
            this.wishlistMessage = `Added "${p.name}" to wishlist`
          } else {
            this.wishlistError = res.message
          }
        },
        error: err => {
          this.wishlistLoading[p.id] = false
          this.wishlistError = formatHttpError(err, 'Wishlist failed')
        }
      })
  }
}
