  
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HeaderComponent } from '../../components/header/header.component';
import { Sidebar } from '../../components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../services/users.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [HeaderComponent, Sidebar, CommonModule, FormsModule],
  templateUrl: './users.page.html',
  styleUrl: './users.page.css',
})
export class UsersPage implements OnInit {


  users: any[] = [];
  loading = true;
  error = '';
  searchQuery = '';

  get filteredUsers() {
    if (!this.searchQuery.trim()) return this.users;
    const q = this.searchQuery.trim().toLowerCase();
    return this.users.filter(u =>
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.phoneNumber && u.phoneNumber.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  }

  constructor(private usersService: UsersService, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.fetchUsers();
  }

  fetchUsers() {
    this.loading = true;
    this.error = '';
    console.log('Fetching users...');
    this.usersService.getUsers().subscribe({
      next: (response: any) => {
        console.log('Users API response:', response);
        this.users = response.data;
        this.loading = false;
        this.cdr.markForCheck();
        setTimeout(() => console.log('DEBUG after loading=false:', this.loading, this.users.length), 0);
      },
      error: (err) => {
        console.error('Error fetching users:', err);
        this.error = 'Failed to load users';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  deleteUser(id: string) {
    if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      this.usersService.deleteUser(id).subscribe({
        next: () => {
          // Remove user from array
          this.users = this.users.filter(u => (u.id || u._id) !== id);
          console.log('User deleted successfully');
        },
        error: (err) => {
          console.error('Error deleting user:', err);
          alert('فشل في حذف المستخدم');
        }
      });
    }
  }



  blockUser(user: any) {
    if (!confirm('هل أنت متأكد أنك تريد حظر هذا المستخدم؟')) return;
    const now = new Date();
    const suspendTo = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const payload = {
      isBlocked: true,
      suspendTo,
      suspensionReason: 'Violation of terms'
    };
    this.usersService.blockOrUnblockUser(user.id, payload)
      .subscribe({
        next: () => {
          this.fetchUsers();
        },
        error: (err) => {
          if (err?.error?.errorMessage === 'المستخدم محظور مؤقتا بالفعل') {
            this.fetchUsers();
            return;
          }
          console.error(err);
          alert('Failed to block user: ' + (err?.error?.errorMessage || ''));
        }
      });
  }

  unblockUser(user: any) {
    if (!confirm('هل أنت متأكد أنك تريد رفع الحظر عن هذا المستخدم؟')) return;
    const payload = {
      isBlocked: false
    };
    this.usersService.blockOrUnblockUser(user.id, payload)
      .subscribe({
        next: () => {
          this.fetchUsers();
        },
        error: (err) => {
          console.error(err);
          alert('Failed to unblock user');
        }
      });
  }
  

}
