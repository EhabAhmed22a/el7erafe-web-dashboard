import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HeaderComponent } from '../../components/header/header.component';
import { Sidebar } from '../../components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { UsersService } from '../../services/users.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [HeaderComponent, Sidebar, CommonModule],
  templateUrl: './users.page.html',
  styleUrl: './users.page.css',
})
export class UsersPage implements OnInit {

  users: any[] = [];
  loading = true;
  error = '';

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
    // Set suspendTo to 7 days from now
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
          user.isBlocked = true; // Update UI immediately
        },
        error: (err) => {
          // If already blocked, treat as success
          if (err?.error?.errorMessage === 'المستخدم محظور مؤقتا بالفعل') {
            user.isBlocked = true;
            return;
          }
          console.error(err);
          alert('Failed to block user: ' + (err?.error?.errorMessage || ''));
        }
      });
  }

unblockUser(user: any) {
  const payload = {
    isBlocked: false
  };

  this.usersService.blockOrUnblockUser(user.id, payload)
    .subscribe({
      next: () => {
        user.isBlocked = false;
      },
      error: (err) => {
        console.error(err);
        alert('Failed to unblock user');
      }
    });
  }
}
