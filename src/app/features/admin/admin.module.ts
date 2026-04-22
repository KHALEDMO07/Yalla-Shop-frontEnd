import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminShellComponent } from './components/admin-shell/admin-shell.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ManageCustomersComponent } from './pages/manage-customers/manage-customers.component';
import { ManageProductsComponent } from './pages/manage-products/manage-products.component';
import { ManageSellersComponent } from './pages/manage-sellers/manage-sellers.component';
import { PendingProductsComponent } from './pages/pending-products/pending-products.component';
import { CreatePromoComponent } from './components/create-promo/create-promo.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';

@NgModule({
  declarations: [
    AdminShellComponent,
    DashboardComponent,
    ManageCustomersComponent,
    ManageProductsComponent,
    ManageSellersComponent,
    PendingProductsComponent,
    CreatePromoComponent,
    SidebarComponent
  ],
  imports: [
    SharedModule,
    AdminRoutingModule
  ]
})
export class AdminModule { }
