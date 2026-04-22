import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { roleMatchGuard } from './core/guards/role.guard';
import { UnauthorizedComponent } from './shared/components/unauthorized/unauthorized.component';
import { guestGuard } from './core/guards/guest.guard';

const routes: Routes = [
  // Default redirect
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },

  // Auth (login, register, forgot-password)
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadChildren: () =>
      import('./features/auth/auth.module').then(m => m.AuthModule)
  },

  // Admin area
  {
    path: 'admin',
    canMatch: [roleMatchGuard],
    data: { roles: ['Admin'] },
    loadChildren: () =>
      import('./features/admin/admin.module').then(m => m.AdminModule)
  },

  {
    path: 'seller',
    canMatch: [roleMatchGuard],
    data: { roles: ['Seller'] },
    loadChildren: () =>
      import('./features/seller/seller.module').then(m => m.SellerModule)
  },
  // {
  //   path: 'unauthorized',
  //   component: UnauthorizedComponent
  // },
  {
    path: 'marketing',
    redirectTo: 'dashboard/marketing/overview',
    pathMatch: 'full'
  },

  {
    path: 'products',
    loadChildren: () =>
      import('./features/product/product.module').then(m => m.ProductModule)
  },

  // Customer-facing pages (home, products, cart, etc.)
  {
    path: '',
    loadChildren: () =>
      import('./features/customer/customer.module').then(m => m.CustomerModule)
  },

  // Wildcard — redirect to home
  {
    path: '**',
    redirectTo: 'home'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
