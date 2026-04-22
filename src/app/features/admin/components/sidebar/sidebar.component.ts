import { Component, Input, Output, EventEmitter } from '@angular/core';
import { AdminNavigationItem } from '../../models/admin.models';

@Component({
  selector: 'app-admin-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  @Input() isOpen = false;
  @Input() navigationItems: ReadonlyArray<AdminNavigationItem> = [];

  @Input() displayName!: string;
  @Input() displayEmail!: string;

  @Output() close = new EventEmitter<void>();

  trackByRoute(_index: number, item: AdminNavigationItem): string {
    return item.route;
  }

  onClose() {
    this.close.emit();
  }
}