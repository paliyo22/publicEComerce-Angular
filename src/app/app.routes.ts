import { Routes } from '@angular/router';
import { Home } from './home/home';
import { ProductDetails } from './product/details/details';
import { Cart } from './cart/cart';
import { AccountPublicProfile } from './account/public-profile/public-profile';
import { AccountCreate } from './account/create/create';
import { Account } from './account/account';
import { AccountProducts } from './account/account-products/account-products';
import { NotFoundPage } from './not-found-page/not-found-page';
import { Category } from './product/category/category';
import { Search } from './product/search/search';
import { OrderDetails } from './order/details/details';
import { Record } from './order/records/record';
import { Balance } from './balance/balance';
import { authGuard } from '../guards/auth-guard';

export const routes: Routes = [
    {path: '', component: Home},
    {path: 'product/:id', component: ProductDetails},
    {path: 'category/:category', component: Category},
    {path: 'search/:search_query', component: Search}, 
    {path: 'profile/:account', component: AccountPublicProfile}, 

    {path: 'sign-up', component: AccountCreate, canActivate: [authGuard(false)]}, // lleva !authGuard

    {path: 'account', component: Account, canActivate: [authGuard()]}, // lleva authGuard
    {path: 'account/records', component: Record, canActivate: [authGuard()]}, // lleva authGuard
    {path: 'account/products', component: AccountProducts, canActivate: [authGuard()]}, // lleva authGuard
    {path: 'account/balance', component: Balance, canActivate: [authGuard()]}, // lleva authGuard
    
    {path: 'cart', component: Cart, canActivate: [authGuard()]}, // lleva authGuard
    {path: 'order', component: OrderDetails, canActivate: [authGuard()]}, // lleva authGuard

    {path: '**', component: NotFoundPage}
];
