import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { ProductFilterParams } from '../../models/product.model';
import { Category } from '../../../../core/models/category.model';

@Component({
  selector: 'app-filter-drawer',
  templateUrl: './filter-drawer.component.html'
})
export class FilterDrawerComponent implements OnChanges {
  @Input() open = false;
  @Input() filters!: ProductFilterParams;
  @Input() categories: Category[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() apply = new EventEmitter<ProductFilterParams>();
  @Output() reset = new EventEmitter<void>();

  draft: ProductFilterParams = {};

  ngOnChanges(changes: SimpleChanges) {
    if (changes['filters']) {
      this.draft = { ...this.filters };
    }
  }

  onApply() {
    this.apply.emit({ ...this.draft });
  }

  onReset() {
    this.reset.emit();
  }

  stop(e: Event) {
    e.stopPropagation();
  }
}