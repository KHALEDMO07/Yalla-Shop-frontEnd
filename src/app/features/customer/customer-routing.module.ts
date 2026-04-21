import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { roleChildGuard, roleGuard } from '../../core/guards/role.guard';
import { HomeComponent } from './pages/home/home.component';
import { CartComponent } from './pages/cart/cart.component';
import { OrderHistoryComponent } from './pages/order-history/order-history.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { WishlistComponent } from './pages/wishlist/wishlist.component';
import { UpdateEmailComponent } from '../Profile/Pages/UpdateEmail/update-email/update-email.component';
import { ChangePasswordComponent } from '../Profile/Pages/ChangePassword/change-password/change-password.component';

const routes: Routes = [
  {
    path: '',
    canActivateChild: [authGuard, roleChildGuard],
    data: { roles: ['Customer'] },
    children: [
      { path: 'home', component: HomeComponent, canActivate: [authGuard, roleGuard], data: { roles: ['Customer'] } },
      { path: 'cart', component: CartComponent, canActivate: [authGuard, roleGuard], data: { roles: ['Customer'] } },
      { path: 'orders', component: OrderHistoryComponent, canActivate: [authGuard, roleGuard], data: { roles: ['Customer'] } },
      { path: 'profile', component: ProfileComponent, canActivate: [authGuard, roleGuard], data: { roles: ['Customer'] } },
      { path: 'update-email', component: UpdateEmailComponent, canActivate: [authGuard, roleGuard], data: { roles: ['Customer'] } },
      { path: 'change-password', component: ChangePasswordComponent, canActivate: [authGuard, roleGuard], data: { roles: ['Customer'] } },
      { path: 'wishlist', component: WishlistComponent, canActivate: [authGuard, roleGuard], data: { roles: ['Customer'] } }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CustomerRoutingModule {}
