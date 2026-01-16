import { Component, OnInit } from '@angular/core';
import { RequestsService } from '../../services/requests.service';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../components/header/header.component';
import { Sidebar } from '../../components/sidebar/sidebar.component';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { buildPaginationState, extractPaginatedPayload } from '../../utils/pagination.util';

interface TechnicianRequest {
  id: string;
  name: string;
  phone: string;
  service: string;
  location: string;
  status: 'pending' | 'approved' | 'rejected';
  // Add any other fields from backend as needed
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
  imports: [HeaderComponent, Sidebar, FormsModule, PaginationComponent],
  templateUrl: './requests.page.html',
  styleUrl: './requests.page.css',
})
export class RequestsPage implements OnInit {
  searchQuery = '';
  activeTab: 'all' | 'pending' | 'approved' | 'rejected' = 'pending';
  
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

  private readonly statusParamMap: Record<'all' | 'pending' | 'approved' | 'rejected', number | null> = {
    all: null,
    pending: 1,
    approved: null,
    rejected: null
  };

  constructor(private requestsService: RequestsService) {}

  ngOnInit() {
    this.fetchRequests();
  }

  fetchRequests(pageNumber: number = this.pageNumber, pageSize: number = this.pageSize) {
    this.pageNumber = pageNumber;
    this.pageSize = pageSize;
    this.loading = true;
    this.error = '';
    const statusFilter = this.statusParamMap[this.activeTab];

    this.requestsService.getTechnicianRequests(statusFilter, pageNumber, pageSize).subscribe({
      next: (res) => {
        const payload = extractPaginatedPayload<TechnicianRequest>(res, ['requests', 'data']);
        if (pageNumber > 1 && payload.items.length === 0) {
          this.pageNumber = pageNumber - 1;
          this.hasExactTotal = false;
          this.hasNextPage = false;
          this.loading = false;
          return;
        }
        this.requests = payload.items;
        const pagination = buildPaginationState(payload, pageNumber, pageSize);
        this.totalItems = pagination.totalItems;
        this.hasExactTotal = pagination.hasExactTotal;
        this.hasNextPage = pagination.hasNextPage;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'فشل في تحميل الطلبات';
        this.loading = false;
        this.hasNextPage = false;
      }
    });
  }

  selectTab(tab: 'all' | 'pending' | 'approved' | 'rejected') {
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
    return this.requests.filter(r => r.status === 'pending').length;
  }

  get approvedCount(): number {
    return this.requests.filter(r => r.status === 'approved').length;
  }

  get rejectedCount(): number {
    return this.requests.filter(r => r.status === 'rejected').length;
  }

  get filteredRequests(): TechnicianRequest[] {
    let filtered = this.requests;
    
    // Filter by tab
    if (this.activeTab !== 'all') {
      filtered = filtered.filter(r => r.status === this.activeTab);
    }
    
    // Filter by search
    if (this.searchQuery.trim()) {
      filtered = filtered.filter(r => r.phone.includes(this.searchQuery));
    }
    
    return filtered;
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
    this.requestsService.approveTechnician(request.id).subscribe({
      next: () => {
        request.status = 'approved';
      },
      error: (err) => {
        alert('فشل في قبول الفني');
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
      reason: '',
      customReason: ''
    };
    this.isRejectModalOpen = true;
  }

  closeRejectModal() {
    this.isRejectModalOpen = false;
    this.requestToReject = null;
  }

  confirmReject() {
    if (this.requestToReject) {
      const reason = this.rejectionData.customReason || this.rejectionData.reason || 'غير محدد';
      this.requestsService.rejectTechnician(this.requestToReject.id, reason).subscribe({
        next: () => {
          this.requestToReject!.status = 'rejected';
          this.closeRejectModal();
        },
        error: (err) => {
          alert('فشل في رفض الطلب');
        }
      });
    }
  }
}
