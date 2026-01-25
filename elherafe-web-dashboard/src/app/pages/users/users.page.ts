  
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HeaderComponent } from '../../components/header/header.component';
import { Sidebar } from '../../components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../services/users.service';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { ConfirmationDialogComponent, ConfirmationVariant } from '../../components/confirmation-dialog/confirmation-dialog.component';
import { buildPaginationState, extractPaginatedPayload } from '../../utils/pagination.util';
import { NotificationService } from '../../services/notification.service';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';

type ConfirmDialogState = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  variant: ConfirmationVariant;
};

type BlockModalState = {
  open: boolean;
  user: any | null;
  durationType: 'temporary' | 'permanent';
  days: number;
};

type BlockStatusPayload = {
  isBlocked: boolean;
  suspendTo?: string;
  suspensionReason?: string;
};

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [HeaderComponent, Sidebar, CommonModule, FormsModule, PaginationComponent, ConfirmationDialogComponent, LoadingSpinnerComponent],
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
  sidebarOpen = false;
  blockModal: BlockModalState = {
    open: false,
    user: null,
    durationType: 'temporary',
    days: 7
  };

  get filteredUsers() {
    if (!this.searchQuery.trim()) return this.users;
    const q = this.searchQuery.trim().toLowerCase();
    return this.users.filter(u =>
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.phoneNumber && u.phoneNumber.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  }

  constructor(private usersService: UsersService, private cdr: ChangeDetectorRef, private notificationService: NotificationService) { }

  ngOnInit() {
    this.fetchUsers();
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar() {
    this.sidebarOpen = false;
  }

  fetchUsers(pageNumber: number = this.pageNumber, pageSize: number = this.pageSize) {
    this.pageNumber = pageNumber;
    this.pageSize = pageSize;
    this.loading = true;
    this.error = '';
    this.usersService.getUsers(pageNumber, pageSize).subscribe({
      next: (response: any) => {
        const payloadSource = response?.data?.clients ?? response?.clients ?? response;
        const payload = extractPaginatedPayload<any>(payloadSource, ['clients', 'data']);
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
            this.notificationService.success('تم حذف المستخدم');
          },
          error: (err) => {
            console.error('Error deleting user:', err);
            alert('فشل في حذف المستخدم');
            this.notificationService.error('تعذر حذف المستخدم');
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
    this.blockModal = {
      open: true,
      user,
      durationType: 'temporary',
      days: 7
    };
  }

  closeBlockModal() {
    this.blockModal = {
      open: false,
      user: null,
      durationType: 'temporary',
      days: 7
    };
  }

  confirmBlockModal() {
    if (!this.blockModal.user) {
      return;
    }
    const payload: BlockStatusPayload = {
      isBlocked: true,
      suspensionReason: 'Violation of terms'
    };
    if (this.blockModal.durationType === 'temporary') {
      const now = new Date();
      payload.suspendTo = new Date(now.getTime() + this.blockModal.days * 24 * 60 * 60 * 1000).toISOString();
    }

    this.usersService.blockOrUnblockUser(this.blockModal.user.id, payload)
      .subscribe({
        next: () => {
          this.fetchUsers();
          this.notificationService.success(
            this.blockModal.durationType === 'temporary' ? 'تم حظر المستخدم مؤقتاً' : 'تم حظر المستخدم بشكل دائم'
          );
          this.closeBlockModal();
        },
        error: (err) => {
          if (err?.error?.errorMessage === 'المستخدم محظور مؤقتا بالفعل') {
            this.fetchUsers();
            this.notificationService.success('المستخدم محظور بالفعل');
            this.closeBlockModal();
            return;
          }
          console.error(err);
          alert('Failed to block user: ' + (err?.error?.errorMessage || ''));
          this.notificationService.error('تعذر حظر المستخدم');
        }
      });
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
        const payload: BlockStatusPayload = {
          isBlocked: false
        };
        this.usersService.blockOrUnblockUser(user.id, payload)
          .subscribe({
            next: () => {
              this.fetchUsers();
              this.notificationService.success('تم رفع الحظر');
            },
            error: (err) => {
              console.error(err);
              alert('Failed to unblock user');
              this.notificationService.error('تعذر رفع الحظر');
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
