import { Component, OnInit } from '@angular/core';
import { RequestsService, RejectTechnicianPayload } from '../../services/requests.service';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../components/header/header.component';
import { Sidebar } from '../../components/sidebar/sidebar.component';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { buildPaginationState, extractPaginatedPayload } from '../../utils/pagination.util';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { NotificationService } from '../../services/notification.service';
import { environment } from '../../../environments/environment';
import { finalize } from 'rxjs/operators';

type TechnicianStatus = 'pending' | 'approved' | 'rejected';

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
  imports: [HeaderComponent, Sidebar, FormsModule, PaginationComponent, LoadingSpinnerComponent],
  templateUrl: './requests.page.html',
  styleUrl: './requests.page.css',
})
export class RequestsPage implements OnInit {
  environment = environment;
  searchQuery = '';
  activeTab: 'all' | 'pending' | 'rejected' = 'pending';
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
  private tabTotals: Record<'all' | 'pending' | 'rejected', number> = {
    all: 0,
    pending: 0,
    rejected: 0
  };
  private fetchSequence = 0;
  private pendingRequests = 0;

  private isLatestRequest(requestId: number): boolean {
    return this.fetchSequence === requestId;
  }

  private readonly statusParamMap: Record<'all' | 'pending' | 'rejected', number | null> = {
    all: null,
    pending: 1,
    rejected: 3
  };

  constructor(private requestsService: RequestsService, private notificationService: NotificationService) {}

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
    const requestId = ++this.fetchSequence;
    this.pageNumber = pageNumber;
    this.pageSize = pageSize;
    this.loading = true;
    this.pendingRequests++;
    this.error = '';
    const statusFilter = this.statusParamMap[this.activeTab];

    this.requestsService
      .getTechnicianRequests(statusFilter, pageNumber, pageSize)
      .pipe(
        finalize(() => {
          this.pendingRequests = Math.max(this.pendingRequests - 1, 0);
          if (this.pendingRequests === 0) {
            this.loading = false;
          }
        })
      )
      .subscribe({
      next: (res) => {
        const payloadSource = (res as any)?.data ?? (res as any)?.requests ?? res;
        const payload = extractPaginatedPayload<any>(payloadSource, ['requests', 'data']);
        const normalizedItems = payload.items.map((item) => this.normalizeRequest(item));

        if (pageNumber > 1 && normalizedItems.length === 0) {
          const previousPage = Math.max(pageNumber - 1, 1);
          this.pageNumber = previousPage;
          this.hasExactTotal = false;
          this.hasNextPage = false;
          this.fetchRequests(previousPage, pageSize);
          return;
        }
        if (!this.isLatestRequest(requestId)) {
          return;
        }
        this.requests = normalizedItems;
        const pagination = buildPaginationState(payload, pageNumber, pageSize);
        this.totalItems = pagination.totalItems;
        this.hasExactTotal = pagination.hasExactTotal;
        this.hasNextPage = pagination.hasNextPage;
        this.tabTotals[this.activeTab] = pagination.totalItems;
      },
      error: (err) => {
        if (!this.isLatestRequest(requestId)) {
          return;
        }
        this.error = 'فشل في تحميل الطلبات';
        this.hasNextPage = false;
      }
    });
  }

  selectTab(tab: 'all' | 'pending' | 'rejected') {
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

  get pendingCount(): number {
    return this.tabTotals.pending || (this.activeTab === 'pending' ? this.totalItems : 0);
  }

  get rejectedCount(): number {
    return this.tabTotals.rejected || (this.activeTab === 'rejected' ? this.totalItems : 0);
  }

  get allCount(): number {
    return this.tabTotals.all || (this.activeTab === 'all' ? this.totalItems : this.requests.length);
  }

  get filteredRequests(): TechnicianRequest[] {
    if (!this.searchQuery.trim()) {
      return this.requests;
    }
    const query = this.searchQuery.trim();
    return this.requests.filter((request) => request.phoneNumber?.includes(query));
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

  private normalizeRequest(raw: any): TechnicianRequest {
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
      status: this.mapStatus(raw?.technicianStatus ?? raw?.status),
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
      case 1:
      default:
        return 'pending';
    }
  }
}
