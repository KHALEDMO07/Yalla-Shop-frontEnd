import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';
import { Category } from '../../../../core/models/category.model';
import { CategoryService } from '../../../../core/services/category.service';
import { formatHttpError } from '../../../../core/utils/http-error.util';
import { productPictureSrc } from '../../../../core/utils/product-image.util';
import { Product, ProductStatus } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../../../core/services/cart.service';
import { CartAnimationService } from '../../../../core/services/cart-animation.service';
import { log } from 'console';

@Component({
  selector: 'app-product-detail-page',
  templateUrl: './product-detail-page.component.html',
  styleUrls: ['./product-detail-page.component.scss']
})
export class ProductDetailPageComponent implements OnInit {
  product: Product | null = null;
  category: Category | null = null;
  loading = false;
  error: string | null = null;
  cartMessage: string | null = null;
  cartError: string | null = null;

  extraFields: { key: string; value: string }[] = [];
  /** Hero image failed (404/500); show placeholder instead of broken icon. */
  heroImageFailed = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly productService: ProductService,
    private readonly categoryService: CategoryService,
    private readonly cartService: CartService,
    private readonly cartAnimationService: CartAnimationService
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap(params => {
          const id = Number(params.get('id'));
          if (!Number.isFinite(id) || id <= 0) {
            this.error = 'Invalid product';
            this.product = null;
            this.category = null;
            this.extraFields = [];
            return of(null);
          }
          this.loading = true;
          this.error = null;
          return this.productService.getById(id).pipe(
            switchMap(p =>
              this.categoryService.getById(p.categoryId).pipe(
                map(c => ({ product: p, category: c })),
                catchError(() => of({ product: p, category: null as Category | null }))
              )
            ),
            catchError(err => {
              this.error = formatHttpError(err, 'Could not load product');
              return of(null);
            }),
            finalize(() => (this.loading = false))
          );
        })
      )
      .subscribe(bundle => {
        this.heroImageFailed = false;
        if (!bundle) {
          this.product = null;
          this.category = null;
          this.extraFields = [];
          return;
        }
        this.product = bundle.product;
        this.category = bundle.category;
        this.extraFields = this.buildExtraRows(bundle.product);
      });
  }

  pictureSrc(): string | null {
    if (!this.product || this.heroImageFailed) {
      return null;
    }
    return productPictureSrc(this.product.picture);
  }

  onHeroImageError(): void {
    this.heroImageFailed = true;
  }

  // addToCart(): void {
  //   if (!this.product) {
  //     return;
  //   }
  //   this.cartMessage = null;
  //   this.cartError = null;
  //   this.cartService.addItem(this.product.id, 1).subscribe({
  //     next: () => (this.cartMessage = 'Added to cart'),
  //     error: err => (this.cartError = formatHttpError(err, 'Could not add to cart'))
  //   });
  // }
  addToCart(event?: MouseEvent): void {
    if (!this.product) {
      return;
    }
    console.log(event);
    

    const availableStock = this.product.stockQuantity; 

    this.cartMessage = null;
    this.cartError = null;

    this.cartService.addItem(this.product.id, 1, availableStock).subscribe({
      next: () => (this.cartMessage = 'Added to cart'),
      error: err => {
        this.cartError = err.message || formatHttpError(err, 'Could not add to cart');
      }
    });

    if (event && (availableStock === undefined || availableStock >= 1)) {
      const img = this.product.picture || 'assets/images/placeholder.png';      
      this.cartAnimationService.animateToCart(event, img);
    }
  }

  private buildExtraRows(p: Product): { key: string; value: string }[] {
    const rows: { key: string; value: string }[] = [
      { key: 'Stock', value: String(p.stockQuantity) },
      { key: 'Listed on', value: p.createdAt || '—' }
    ];
    return rows;
  }
}
