import { Routes } from '@angular/router';
import { LoginPage } from './pages/login/login.page';
import { UsersPage } from './pages/users/users.page';
import { CraftsmenPage } from './pages/craftsmen/craftsmen.page';
import { ServicesPage } from './pages/services/services.page';
import { RequestsPage } from './pages/requests/requests.page';

export const routes: Routes = [
    { path:'login', component: LoginPage },
    { path:'dashboard-users', component: UsersPage },
    { path:'dashboard-craftsmen', component: CraftsmenPage },
    { path:'dashboard-services', component: ServicesPage },
    { path:'dashboard-requests', component: RequestsPage }
];
