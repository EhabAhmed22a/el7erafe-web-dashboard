import { Component, OnInit } from '@angular/core';
import { RequestsService } from '../../services/requests.service';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../components/header/header.component';
import { Sidebar } from '../../components/sidebar/sidebar.component';

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
  imports: [HeaderComponent, Sidebar, FormsModule],
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

  constructor(private requestsService: RequestsService) {}

  ngOnInit() {
    this.fetchRequests();
  }

  fetchRequests() {
    this.loading = true;
    this.error = '';
    this.requestsService.getTechnicianRequests(1).subscribe({
      next: (res) => {
        this.requests = res.data || res || [];
        this.loading = false;
      },
      error: (err) => {
        this.error = 'فشل في تحميل الطلبات';
        this.loading = false;
      }
    });
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
