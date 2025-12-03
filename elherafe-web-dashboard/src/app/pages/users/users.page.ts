import { Component } from '@angular/core';
import { HeaderComponent } from '../../components/header/header.component';
import { Sidebar } from '../../components/sidebar/sidebar.component';
@Component({
  selector: 'app-users',
  standalone: true,
  imports: [HeaderComponent, Sidebar],
  templateUrl: './users.page.html',
  styleUrl: './users.page.css',
})
export class UsersPage {

}
