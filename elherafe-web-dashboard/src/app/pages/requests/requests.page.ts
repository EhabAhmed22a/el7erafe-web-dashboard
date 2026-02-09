import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RequestsService, RejectTechnicianPayload } from '../../services/requests.service';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../components/header/header.component';
import { Sidebar } from '../../components/sidebar/sidebar.component';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { buildPaginationState, extractPaginatedPayload } from '../../utils/pagination.util';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { ConfirmationDialogComponent } from '../../components/confirmation-dialog/confirmation-dialog.component';
import { NotificationService } from '../../services/notification.service';
import { environment } from '../../../environments/environment';
import { forkJoin } from 'rxjs';

type TechnicianStatus = 'pending' | 'approved' | 'rejected' | 'blocked';

interface TechnicianRequest {
  id: string;
  userId: string;
  name: string;
  phoneNumber: string;
  serviceType: string;
  governorate?: string;
  city?: string;
  location: string;
  frontIdImage?: string | null;
  backIdImage?: string | null;
  criminalRecordImage?: string | null;
  status: TechnicianStatus;
  raw?: any;
}

interface RejectionData {
  invalidFrontId: boolean;
  invalidBackId: boolean;
  invalidCriminalRecord: boolean;
  reason: string;
  customReason: string;
}

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [HeaderComponent, Sidebar, FormsModule, PaginationComponent, LoadingSpinnerComponent, ConfirmationDialogComponent],
  templateUrl: './requests.page.html',
  styleUrl: './requests.page.css',
})
export class RequestsPage implements OnInit {
  environment = environment;
  searchQuery = '';
  activeTab: 'pending' | 'rejected' | 'blocked' = 'pending';
  sidebarOpen = false;
  
  // Document Modal
  isDocumentModalOpen = false;
  selectedRequest: TechnicianRequest | null = null;
  selectedDocType: 'front' | 'back' | 'criminal' = 'front';

  // Rejection Modal
  isRejectModalOpen = false;
  requestToReject: TechnicianRequest | null = null;
  rejectionData: RejectionData = {
    invalidFrontId: false,
    invalidBackId: false,
    invalidCriminalRecord: false,
    reason: '',
    customReason: ''
  };

  isReasonDialogOpen = false;
  reasonDialogTitle = '';
  reasonDialogMessage = '';

  // Unblock Confirmation Dialog
  isUnblockDialogOpen = false;
  requestToUnblock: TechnicianRequest | null = null;

  private readonly statusFilters = [1, 3, 4];
  private readonly statusOrder: Record<TechnicianStatus, number> = {
    pending: 1,
    approved: 2,
    rejected: 3,
    blocked: 4
  };

  requests: TechnicianRequest[] = [];
  loading = false;
  error = '';
  pageNumber = 1;
  pageSize = 5;
  totalItems = 0;
  hasExactTotal = true;
  hasNextPage = false;
  readonly pageSizeOptions = [5, 10, 20, 50];
  rejectionReasons: string[] = [];
  rejectionReasonsLoading = false;

  constructor(
    private requestsService: RequestsService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.fetchRequests();
    this.fetchRejectionReasons();
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar() {
    this.sidebarOpen = false;
  }

  fetchRequests(pageNumber: number = this.pageNumber, pageSize: number = this.pageSize) {
    this.pageNumber = pageNumber;
    this.pageSize = pageSize;
    this.loading = true;
    this.error = '';
    const statusFilter = this.activeTab === 'pending' ? 1 : this.activeTab === 'rejected' ? 3 : 4;
    this.requestsService.getTechnicianRequests(statusFilter, pageNumber, pageSize).subscribe({
        next: (res) => {
          const payloadSource =
            (res as any)?.data?.requests ??
            (res as any)?.data?.technicians ??
            (res as any)?.data ??
            (res as any)?.requests ??
            res;
          const payload = extractPaginatedPayload<any>(payloadSource, [
            'requests',
            'technicians',
            'technicianRequests',
            'data'
          ]);
          const normalizedItems = payload.items.map((item) => this.normalizeRequest(item, statusFilter));

          if (pageNumber > 1 && normalizedItems.length === 0) {
            const previousPage = Math.max(pageNumber - 1, 1);
            this.pageNumber = previousPage;
            this.hasExactTotal = false;
            this.hasNextPage = false;
            this.loading = false;
            this.cdr.markForCheck();
            this.fetchRequests(previousPage, pageSize);
            return;
          }

          const pagination = buildPaginationState(payload, pageNumber, pageSize);
          this.requests = normalizedItems;
          this.totalItems = pagination.totalItems;
          this.hasExactTotal = pagination.hasExactTotal;
          this.hasNextPage = pagination.hasNextPage;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.error = 'فشل في تحميل الطلبات';
          this.hasNextPage = false;
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  selectTab(tab: 'pending' | 'rejected' | 'blocked') {
    if (this.activeTab === tab) {
      return;
    }
    this.activeTab = tab;
    this.fetchRequests(1, this.pageSize);
  }

  onPageChange(page: number) {
    this.fetchRequests(page, this.pageSize);
  }

  onPageSizeChange(size: number) {
    this.fetchRequests(1, size);
  }

  get filteredRequests(): TechnicianRequest[] {
    if (!this.searchQuery.trim()) {
      return this.requests;
    }
    const query = this.searchQuery.trim();
    return this.requests.filter((request) => request.phoneNumber?.includes(query));
  }

  get displayPageSize(): number {
    return this.pageSize;
  }

  openReasonDialog(kind: 'rejected' | 'blocked') {
    this.reasonDialogTitle = kind === 'rejected' ? 'سبب الرفض' : 'سبب الحظر';
    this.reasonDialogMessage = kind === 'rejected' ? 'سبب الرفض غير متاح حاليا.' : 'سبب الحظر غير متاح حاليا.';
    this.isReasonDialogOpen = true;
  }

  closeReasonDialog() {
    this.isReasonDialogOpen = false;
  }

  unblockTechnician(request: TechnicianRequest) {
    this.requestToUnblock = request;
    this.isUnblockDialogOpen = true;
  }

  confirmUnblock() {
    if (!this.requestToUnblock) {
      return;
    }
    this.loading = true;
    this.isUnblockDialogOpen = false;
    this.requestsService.unblockTechnician(this.requestToUnblock.id).subscribe({
      next: () => {
        this.notificationService.success('تم رفع الحظر عن الفني بنجاح');
        this.requestToUnblock = null;
        this.fetchRequests(this.pageNumber, this.pageSize);
      },
      error: () => {
        this.notificationService.error('فشل في رفع الحظر عن الفني');
        this.requestToUnblock = null;
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  cancelUnblock() {
    this.isUnblockDialogOpen = false;
    this.requestToUnblock = null;
  }

  // Document Modal
  openDocumentModal(request: TechnicianRequest) {
    this.selectedRequest = request;
    this.selectedDocType = 'front';
    this.isDocumentModalOpen = true;
  }

  closeDocumentModal() {
    this.isDocumentModalOpen = false;
  }

  // Approve Request
  approveRequest(request: TechnicianRequest) {
    if (!request.userId) {
      this.notificationService.error('معرف المستخدم غير متوفر لهذا الطلب');
      return;
    }

    this.requestsService.approveTechnician(request.userId).subscribe({
      next: () => {
        this.notificationService.success('تم قبول الطلب بنجاح');
        this.fetchRequests(this.pageNumber, this.pageSize);
      },
      error: () => {
        this.notificationService.error('تعذر قبول الطلب');
      }
    });
  }

  // Rejection Modal
  openRejectModal(request: TechnicianRequest) {
    this.requestToReject = request;
    this.rejectionData = {
      invalidFrontId: false,
      invalidBackId: false,
      invalidCriminalRecord: false,
      reason: this.rejectionReasons[0] ?? '',
      customReason: ''
    };
    this.isRejectModalOpen = true;
  }

  closeRejectModal() {
    this.isRejectModalOpen = false;
    this.requestToReject = null;
  }

  confirmReject() {
    if (!this.requestToReject) {
      return;
    }

    const resolvedReason = (this.rejectionData.customReason || this.rejectionData.reason).trim();
    if (!resolvedReason) {
      this.notificationService.error('يرجى اختيار سبب الرفض أو إدخال سبب مخصص');
      return;
    }

    const payload: RejectTechnicianPayload = {
      id: this.requestToReject.id,
      rejectionReason: resolvedReason,
      is_front_rejected: this.rejectionData.invalidFrontId,
      is_back_rejected: this.rejectionData.invalidBackId,
      is_criminal_rejected: this.rejectionData.invalidCriminalRecord
    };

    this.requestsService.rejectTechnician(payload).subscribe({
      next: () => {
        this.notificationService.success('تم رفض الطلب بنجاح');
        this.closeRejectModal();
        this.fetchRequests(this.pageNumber, this.pageSize);
      },
      error: () => {
        this.notificationService.error('تعذر رفض الطلب');
      }
    });
  }

  getDocumentUrl(docType: 'front' | 'back' | 'criminal'): string | null {
    if (!this.selectedRequest) {
      return null;
    }

    const fileNameMap = {
      front: this.selectedRequest.frontIdImage,
      back: this.selectedRequest.backIdImage,
      criminal: this.selectedRequest.criminalRecordImage
    } as const;

    const fileName = fileNameMap[docType];
    if (!fileName) {
      return null;
    }
    return `${environment.apiUrl}/api/Files/technician/${fileName}`;
  }

  private fetchRejectionReasons() {
    this.rejectionReasonsLoading = true;
    this.requestsService.getRejectionReasons().subscribe({
      next: (response) => {
        this.rejectionReasons = this.normalizeRejectionReasons(response);
        this.rejectionReasonsLoading = false;
      },
      error: () => {
        this.rejectionReasonsLoading = false;
      }
    });
  }

  private normalizeRejectionReasons(response: any): string[] {
    if (!response) {
      return [];
    }

    const source = Array.isArray(response)
      ? response
      : Array.isArray(response?.data)
        ? response.data
        : [];

    return source
      .map((entry: any) => this.extractReasonLabel(entry))
      .filter((reason: string | null): reason is string => Boolean(reason));
  }

  private extractReasonLabel(entry: any): string | null {
    if (!entry) {
      return null;
    }
    if (typeof entry === 'string') {
      return entry;
    }
    if (typeof entry === 'object') {
      return entry.reason ?? entry.name ?? entry.title ?? entry.label ?? null;
    }
    return null;
  }

  private normalizeRequest(raw: any, statusOverride?: number): TechnicianRequest {
    const fallback = raw?.user ?? raw?.technician ?? raw?.applicant ?? {};
    const id = raw?.id ?? raw?.technicianRequestId ?? raw?.requestId ?? raw?.userId ?? '';
    const userId = raw?.userId ?? fallback?.id ?? id;
    const name = fallback?.name ?? fallback?.fullName ?? raw?.name ?? 'بدون اسم';
    const phoneNumber = fallback?.phone ?? fallback?.phoneNumber ?? raw?.phone ?? '';
    const serviceType = raw?.service ?? raw?.serviceType ?? fallback?.serviceType ?? fallback?.service ?? 'غير محدد';
    const governorate = raw?.governorate ?? fallback?.governorate ?? raw?.address?.governorate ?? '';
    const city = raw?.city ?? fallback?.city ?? raw?.address?.city ?? '';
    const frontIdImage = raw?.frontIdImage ?? raw?.faceIdImage ?? raw?.frontId ?? fallback?.frontIdImage ?? null;
    const backIdImage = raw?.backIdImage ?? raw?.backId ?? fallback?.backIdImage ?? null;
    const criminalRecordImage = raw?.criminalRecordImage ?? raw?.criminalRecord ?? fallback?.criminalRecordImage ?? null;

    return {
      id: id || userId,
      userId: userId || id,
      name,
      phoneNumber: phoneNumber || '-',
      serviceType,
      governorate,
      city,
      location: this.formatLocation(governorate, city),
      frontIdImage: frontIdImage || null,
      backIdImage: backIdImage || null,
      criminalRecordImage: criminalRecordImage || null,
      status: this.mapStatus(statusOverride ?? raw?.technicianStatus ?? raw?.status),
      raw
    };
  }

  private formatLocation(governorate?: string, city?: string): string {
    return [governorate, city].filter(Boolean).join(' / ') || '-';
  }

  private mapStatus(value: unknown): TechnicianStatus {
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized.includes('pend')) {
        return 'pending';
      }
      if (normalized.includes('reject')) {
        return 'rejected';
      }
      if (normalized.includes('block')) {
        return 'blocked';
      }
      if (normalized.includes('approve')) {
        return 'approved';
      }
    }

    const numeric = typeof value === 'number' ? value : Number(value);
    switch (numeric) {
      case 2:
        return 'approved';
      case 3:
        return 'rejected';
      case 4:
        return 'blocked';
      case 1:
      default:
        return 'pending';
    }
  }

  getRejectionReason(request: TechnicianRequest): string {
    const raw = request.raw ?? {};
    return (
      raw.rejectionReason ||
      raw.rejectReason ||
      raw.reason ||
      raw.rejection?.reason ||
      'غير مذكور'
    );
  }

  getBlockReason(request: TechnicianRequest): string {
    const raw = request.raw ?? {};
    return (
      raw.suspensionReason ||
      raw.blockReason ||
      raw.blockedReason ||
      raw.reason ||
      'غير مذكور'
    );
  }
}
