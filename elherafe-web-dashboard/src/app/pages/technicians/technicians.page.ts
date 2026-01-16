  
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HeaderComponent } from '../../components/header/header.component';
import { Sidebar } from '../../components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TechniciansService } from '../../services/technicians.service';
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
  selector: 'app-technicians',
  standalone: true,
  imports: [HeaderComponent, Sidebar, CommonModule, FormsModule, PaginationComponent, ConfirmationDialogComponent],
  templateUrl: './technicians.page.html',
  styleUrl: './technicians.page.css',
})
export class TechniciansPage implements OnInit {
    environment = environment;
  technicians: any[] = [];
  loading = true;
  error = '';
  searchQuery = '';
  pageNumber = 1;
  pageSize = 10;
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

  isModalOpen = false;
  selectedTechnician: any = null;
  selectedDocType: 'front' | 'back' | 'criminal' = 'front';

  constructor(private techniciansService: TechniciansService, private cdr: ChangeDetectorRef) { }


  ngOnInit() {
    this.fetchTechnicians();
  }

  openDocumentModal(technician: any) {
    this.selectedTechnician = technician;
    this.selectedDocType = 'front';
    this.isModalOpen = true;
  }

  closeDocumentModal() {
    this.isModalOpen = false;
    this.selectedTechnician = null;
  }

  fetchTechnicians(pageNumber: number = this.pageNumber, pageSize: number = this.pageSize) {
    this.pageNumber = pageNumber;
    this.pageSize = pageSize;
    this.loading = true;
    this.error = '';
    this.techniciansService.getTechnicians(pageNumber, pageSize).subscribe({
      next: (response: any) => {
        const payload = extractPaginatedPayload<any>(response, ['technicians', 'data']);
        const technicians = payload.items;

        if (pageNumber > 1 && technicians.length === 0) {
          this.pageNumber = pageNumber - 1;
          this.hasExactTotal = false;
          this.hasNextPage = false;
          this.loading = false;
          this.cdr.markForCheck();
          return;
        }

        this.technicians = technicians;
        const pagination = buildPaginationState(payload, pageNumber, pageSize);
        this.totalItems = pagination.totalItems;
        this.hasExactTotal = pagination.hasExactTotal;
        this.hasNextPage = pagination.hasNextPage;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading technicians:', err);
        this.error = 'Failed to load technicians';
        this.loading = false;
        this.hasNextPage = false;
        this.cdr.markForCheck();
      }
    });
  }

  deleteTechnician(id: string) {
    this.openConfirmDialog(
      {
        title: 'حذف الفني',
        message: 'هل أنت متأكد من حذف هذا الفني؟',
        confirmLabel: 'حذف',
        variant: 'danger'
      },
      () => {
        this.techniciansService.deleteTechnician(id).subscribe({
          next: () => {
            const targetPage = this.technicians.length === 1 && this.pageNumber > 1 ? this.pageNumber - 1 : this.pageNumber;
            this.fetchTechnicians(targetPage, this.pageSize);
          },
          error: () => {
            alert('فشل في حذف الفني');
          }
        });
      }
    );
  }

  blockTechnician(tech: any) {
    // Set suspendTo to 7 days from now
    const now = new Date();
    const suspendTo = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const payload = {
      isBlocked: true,
      suspendTo,
      suspensionReason: 'Violation of terms'
    };
    this.techniciansService.blockOrUnblockTechnician(tech.id, payload)
      .subscribe({
        next: () => {
          tech.isBlocked = true; // Update UI immediately
        },
        error: (err) => {
          // If already blocked, treat as success
          if (err?.error?.errorMessage === 'المستخدم محظور مؤقتا بالفعل') {
            tech.isBlocked = true;
            return;
          }
          console.error(err);
          alert('Failed to block technician: ' + (err?.error?.errorMessage || ''));
        }
      });
  }

  unblockTechnician(tech: any) {
    const payload = {
      isBlocked: false
    };
    this.techniciansService.blockOrUnblockTechnician(tech.id, payload)
      .subscribe({
        next: () => {
          tech.isBlocked = false;
        },
        error: (err) => {
          console.error(err);
          alert('Failed to unblock technician: ' + (err?.error?.errorMessage || ''));
        }
      });
  }

    get filteredTechnicians() {
      if (!this.searchQuery.trim()) {
        return this.technicians;
      }
      const q = this.searchQuery.trim().toLowerCase();
      const normalize = (value: unknown) => (value ?? '').toString().toLowerCase();
      return this.technicians.filter((tech) => {
        const name = normalize(tech.name);
        const phone = normalize(tech.phone);
        const service = normalize(tech.serviceType);
        return name.includes(q) || phone.includes(q) || service.includes(q);
      });
    }

    onPageChange(page: number) {
      this.fetchTechnicians(page, this.pageSize);
    }

    onPageSizeChange(size: number) {
      this.fetchTechnicians(1, size);
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
