import { Routes } from '@angular/router';
import { LoginPage } from './pages/login/login.page';
import { UsersPage } from './pages/users/users.page';
import { CraftsmenPage } from './pages/craftsmen/craftsmen.page';

export const routes: Routes = [
    { path:'login', component: LoginPage },
    { path:'dashboard-users', component: UsersPage },
    { path:'dashboard-craftsmen', component: CraftsmenPage }
];
