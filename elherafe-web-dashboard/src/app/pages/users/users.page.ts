  
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HeaderComponent } from '../../components/header/header.component';
import { Sidebar } from '../../components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../services/users.service';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { ConfirmationDialogComponent, ConfirmationVariant } from '../../components/confirmation-dialog/confirmation-dialog.component';
import { buildPaginationState, extractPaginatedPayload } from '../../utils/pagination.util';

type ConfirmDialogState = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  variant: ConfirmationVariant;
};

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [HeaderComponent, Sidebar, CommonModule, FormsModule, PaginationComponent, ConfirmationDialogComponent],
  templateUrl: './users.page.html',
  styleUrl: './users.page.css',
})
export class UsersPage implements OnInit {


  users: any[] = [];
  loading = true;
  error = '';
  searchQuery = '';
  pageNumber = 1;
  pageSize = 5;
  totalItems = 0;
  hasExactTotal = true;
  hasNextPage = false;
  readonly pageSizeOptions = [5, 10, 20, 50];
  confirmDialog: ConfirmDialogState = {
    open: false,
    title: 'تأكيد الإجراء',
    message: '',
    confirmLabel: 'تأكيد',
    cancelLabel: 'إلغاء',
    variant: 'primary'
  };
  private confirmDialogAction: (() => void) | null = null;

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

  fetchUsers(pageNumber: number = this.pageNumber, pageSize: number = this.pageSize) {
    this.pageNumber = pageNumber;
    this.pageSize = pageSize;
    this.loading = true;
    this.error = '';
    this.usersService.getUsers(pageNumber, pageSize).subscribe({
      next: (response: any) => {
        const payload = extractPaginatedPayload<any>(response, ['clients', 'data']);
        if (pageNumber > 1 && payload.items.length === 0) {
          this.pageNumber = pageNumber - 1;
          this.hasExactTotal = false;
          this.hasNextPage = false;
          this.loading = false;
          this.cdr.markForCheck();
          return;
        }
        this.users = payload.items;
        const pagination = buildPaginationState(payload, pageNumber, pageSize);
        this.totalItems = pagination.totalItems;
        this.hasExactTotal = pagination.hasExactTotal;
        this.hasNextPage = pagination.hasNextPage;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error fetching users:', err);
        this.error = 'Failed to load users';
        this.loading = false;
        this.hasNextPage = false;
        this.cdr.markForCheck();
      }
    });
  }

  deleteUser(id: string) {
    this.openConfirmDialog(
      {
        title: 'حذف المستخدم',
        message: 'هل أنت متأكد من حذف هذا المستخدم؟',
        confirmLabel: 'حذف',
        variant: 'danger'
      },
      () => {
        this.usersService.deleteUser(id).subscribe({
          next: () => {
            this.fetchUsers(this.pageNumber, this.pageSize);
          },
          error: (err) => {
            console.error('Error deleting user:', err);
            alert('فشل في حذف المستخدم');
          }
        });
      }
    );
  }

  onPageChange(page: number) {
    this.fetchUsers(page, this.pageSize);
  }

  onPageSizeChange(size: number) {
    this.fetchUsers(1, size);
  }



  blockUser(user: any) {
    this.openConfirmDialog(
      {
        title: 'حظر المستخدم',
        message: 'هل أنت متأكد أنك تريد حظر هذا المستخدم؟',
        confirmLabel: 'حظر',
        variant: 'danger'
      },
      () => {
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
    );
  }

  unblockUser(user: any) {
    this.openConfirmDialog(
      {
        title: 'رفع الحظر عن المستخدم',
        message: 'هل أنت متأكد أنك تريد رفع الحظر؟',
        confirmLabel: 'رفع الحظر',
        variant: 'primary'
      },
      () => {
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
    );
  }
 
  openConfirmDialog(config: Partial<ConfirmDialogState>, action: () => void) {
    this.confirmDialog = { ...this.confirmDialog, ...config, open: true };
    this.confirmDialogAction = action;
  }

  handleConfirmDialog() {
    const action = this.confirmDialogAction;
    this.closeConfirmDialog();
    action?.();
  }

  closeConfirmDialog() {
    this.confirmDialog = { ...this.confirmDialog, open: false };
    this.confirmDialogAction = null;
  }
  
}
