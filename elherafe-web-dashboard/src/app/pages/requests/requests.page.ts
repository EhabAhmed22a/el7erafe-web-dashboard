import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../components/header/header.component';
import { Sidebar } from '../../components/sidebar/sidebar.component';

interface TechnicianRequest {
  id: number;
  name: string;
  phone: string;
  service: string;
  location: string;
  status: 'pending' | 'approved' | 'rejected';
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
export class RequestsPage {
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

  // Sample requests data
  requests: TechnicianRequest[] = [
    { id: 1, name: 'أحمد محمد السيد', phone: '01012345678', service: 'سباك', location: 'القاهرة / مدينة نصر', status: 'pending' },
    { id: 2, name: 'محمود عبدالله', phone: '01198765432', service: 'كهربائي', location: 'الجيزة / الهرم', status: 'pending' },
    { id: 3, name: 'حسن إبراهيم', phone: '01234567890', service: 'نجار', location: 'الإسكندرية / سموحة', status: 'approved' },
    { id: 4, name: 'سامي يوسف', phone: '01567891234', service: 'نقاش', location: 'المنصورة / حي الجامعة', status: 'pending' },
    { id: 5, name: 'خالد عمر', phone: '01098765123', service: 'فني تكييف', location: 'القاهرة / المعادي', status: 'rejected' },
    { id: 6, name: 'عمرو حسين', phone: '01122334455', service: 'حداد', location: 'القاهرة / شبرا', status: 'pending' },
    { id: 7, name: 'ياسر أحمد', phone: '01555666777', service: 'بناء', location: 'الجيزة / 6 أكتوبر', status: 'approved' },
    { id: 8, name: 'طارق محمد', phone: '01888999000', service: 'فني ألومنيوم', location: 'الإسكندرية / المنتزه', status: 'pending' },
  ];

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
    const index = this.requests.findIndex(r => r.id === request.id);
    if (index !== -1) {
      this.requests[index].status = 'approved';
    }
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
      const index = this.requests.findIndex(r => r.id === this.requestToReject!.id);
      if (index !== -1) {
        this.requests[index].status = 'rejected';
      }
    }
    this.closeRejectModal();
  }
}
