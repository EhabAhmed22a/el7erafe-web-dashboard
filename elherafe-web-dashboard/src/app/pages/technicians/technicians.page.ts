  
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HeaderComponent } from '../../components/header/header.component';
import { Sidebar } from '../../components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TechniciansService } from '../../services/technicians.service';
import { RequestsService } from '../../services/requests.service';
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

type BlockDurationType = 'temporary' | 'permanent';

type BlockModalState = {
  open: boolean;
  technician: any | null;
  durationType: BlockDurationType;
  days: number;
};

type BlockStatusPayload = {
  isBlocked: boolean;
  suspendTo?: string;
  suspensionReason?: string;
};

@Component({
  selector: 'app-technicians',
  standalone: true,
  imports: [HeaderComponent, Sidebar, CommonModule, FormsModule, PaginationComponent, ConfirmationDialogComponent, LoadingSpinnerComponent],
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

  isModalOpen = false;
  selectedTechnician: any = null;
  selectedDocType: 'front' | 'back' | 'criminal' = 'front';
  blockModal: BlockModalState = {
    open: false,
    technician: null,
    durationType: 'temporary',
    days: 7
  };
  sidebarOpen = false;

  constructor(
    private techniciansService: TechniciansService,
    private requestsService: RequestsService,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService
  ) { }


  ngOnInit() {
    this.fetchTechnicians();
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar() {
    this.sidebarOpen = false;
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
    this.requestsService.getTechnicianRequests(2, pageNumber, pageSize).subscribe({
      next: (response: any) => {
        const payloadSource =
          response?.data?.technicians ??
          response?.data?.requests ??
          response?.data ??
          response?.technicians ??
          response?.requests ??
          response;
        const payload = extractPaginatedPayload<any>(payloadSource, [
          'technicians',
          'requests',
          'technicianRequests',
          'data'
        ]);
        const technicians = payload.items.map((item) => this.normalizeTechnician(item));

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

  private normalizeTechnician(raw: any): any {
    const fallback = raw?.user ?? raw?.technician ?? raw?.applicant ?? {};
    const id = raw?.id ?? raw?.technicianId ?? raw?.userId ?? fallback?.id ?? '';
    const name = fallback?.name ?? fallback?.fullName ?? raw?.name ?? 'بدون اسم';
    const phone = fallback?.phone ?? fallback?.phoneNumber ?? raw?.phone ?? raw?.phoneNumber ?? '';
    const serviceType = raw?.service ?? raw?.serviceType ?? fallback?.serviceType ?? fallback?.service ?? 'غير محدد';
    const governorate = raw?.governorate ?? fallback?.governorate ?? raw?.address?.governorate ?? '';
    const city = raw?.city ?? fallback?.city ?? raw?.address?.city ?? '';
    const faceIdImage = raw?.faceIdImage ?? raw?.frontIdImage ?? raw?.frontId ?? fallback?.frontIdImage ?? null;
    const backIdImage = raw?.backIdImage ?? raw?.backId ?? fallback?.backIdImage ?? null;
    const criminalRecordImage = raw?.criminalRecordImage ?? raw?.criminalRecord ?? fallback?.criminalRecordImage ?? null;

    return {
      id,
      name,
      phone: phone || '-',
      serviceType,
      governorate: governorate || '-',
      city: city || '-',
      faceIdImage,
      backIdImage,
      criminalRecordImage
    };
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
            this.notificationService.success('تم حذف الفني بنجاح');
          },
          error: () => {
            alert('فشل في حذف الفني');
            this.notificationService.error('تعذر حذف الفني');
          }
        });
      }
    );
  }

  openBlockModal(tech: any) {
    this.blockModal = {
      open: true,
      technician: tech,
      durationType: 'temporary',
      days: 7
    };
  }

  closeBlockModal() {
    this.blockModal = {
      open: false,
      technician: null,
      durationType: 'temporary',
      days: 7
    };
  }

  confirmBlockModal() {
    if (!this.blockModal.technician) {
      return;
    }
    const payload: BlockStatusPayload = {
      isBlocked: true,
      suspensionReason: 'Violation of terms'
    };
    if (this.blockModal.durationType === 'temporary') {
      const now = new Date();
      const suspendTo = new Date(now.getTime() + this.blockModal.days * 24 * 60 * 60 * 1000).toISOString();
      payload.suspendTo = suspendTo;
    }
    this.sendBlockRequest(this.blockModal.technician, payload);
  }

  private sendBlockRequest(tech: any, payload: BlockStatusPayload) {
    this.techniciansService.blockOrUnblockTechnician(tech.id, payload)
      .subscribe({
        next: () => {
          tech.isBlocked = true;
          this.notificationService.success(
            this.blockModal.durationType === 'temporary' ? 'تم حظر الفني مؤقتاً' : 'تم حظر الفني بشكل دائم'
          );
          this.closeBlockModal();
        },
        error: (err) => {
          if (err?.error?.errorMessage === 'المستخدم محظور مؤقتا بالفعل') {
            tech.isBlocked = true;
            this.notificationService.success('الفني محظور بالفعل');
            this.closeBlockModal();
            return;
          }
          console.error(err);
          alert('Failed to block technician: ' + (err?.error?.errorMessage || ''));
          this.notificationService.error('تعذر حظر الفني');
        }
      });
  }

  unblockTechnician(tech: any) {
    const payload: BlockStatusPayload = {
      isBlocked: false
    };
    this.techniciansService.blockOrUnblockTechnician(tech.id, payload)
      .subscribe({
        next: () => {
          tech.isBlocked = false;
          this.notificationService.success('تم رفع الحظر عن الفني');
        },
        error: (err) => {
          console.error(err);
          alert('Failed to unblock technician: ' + (err?.error?.errorMessage || ''));
          this.notificationService.error('تعذر رفع الحظر');
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
