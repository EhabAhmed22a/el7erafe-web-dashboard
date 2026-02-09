import { Routes } from '@angular/router';
import { LoginPage } from './pages/login/login.page';
import { UsersPage } from './pages/users/users.page';
import { TechniciansPage } from './pages/technicians/technicians.page';
import { ServicesPage } from './pages/services/services.page';
import { RequestsPage } from './pages/requests/requests.page';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path:'login', component: LoginPage },
    { path:'dashboard-users', component: UsersPage, canActivate: [authGuard] },
    { path:'dashboard-technicians', component: TechniciansPage, canActivate: [authGuard] },
    { path:'dashboard-services', component: ServicesPage, canActivate: [authGuard] },
    { path:'dashboard-requests', component: RequestsPage, canActivate: [authGuard] }
];
