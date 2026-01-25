import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { HeaderComponent } from '../../components/header/header.component';
import { Sidebar } from '../../components/sidebar/sidebar.component';
import { ServicesService } from '../../services/services.service';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { buildPaginationState, extractPaginatedPayload } from '../../utils/pagination.util';
import { NotificationService } from '../../services/notification.service';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { environment } from '../../../environments/environment';

interface Service {
  id: string;
  icon: string;
  nameAr: string;
  serviceImageURL?: string | null;
  imageSrc?: string | null;
}

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [HeaderComponent, Sidebar, FormsModule, CommonModule, PaginationComponent, LoadingSpinnerComponent],
  templateUrl: './services.page.html',
  styleUrls: ['./services.page.css'],
})
export class ServicesPage implements OnInit {

  selectedImageFile: File | null = null;
  selectedImagePreview: string | null = null;

  searchQuery = '';
  sidebarOpen = false;

  // Modal states
  isAddEditModalOpen = false;
  isDeleteModalOpen = false;
  isEditMode = false;

  // Modal data
  modalService: Service = { id: '', icon: '', nameAr: '' };
  serviceToDelete: Service | null = null;

  services: Service[] = [];
  loading = false;
  error = '';
  pageNumber = 1;
  pageSize = 12;
  totalItems = 0;
  hasExactTotal = true;
  hasNextPage = false;
  readonly pageSizeOptions = [6, 12, 24, 48];

  constructor(private servicesService: ServicesService, private cdr: ChangeDetectorRef, private notificationService: NotificationService) {}

  ngOnInit() {
    this.fetchServices();
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar() {
    this.sidebarOpen = false;
  }

  fetchServices(pageNumber: number = this.pageNumber, pageSize: number = this.pageSize) {
    this.pageNumber = pageNumber;
    this.pageSize = pageSize;
    this.loading = true;
    this.error = '';

    this.servicesService.getServices(pageNumber, pageSize).subscribe({
      next: (res) => {
        const payload = extractPaginatedPayload<Service>(res, ['services', 'data']);
        const rawItems = payload.items || [];
        if (pageNumber > 1 && rawItems.length === 0) {
          this.pageNumber = pageNumber - 1;
          this.hasExactTotal = false;
          this.hasNextPage = false;
          this.loading = false;
          this.cdr.markForCheck();
          return;
        }
        this.services = rawItems.map((s: any) => {
          const rawImage = s.serviceImageURL ?? s.serviceImage ?? s.imageUrl ?? s.image ?? null;
          return {
            id: s.id?.toString() ?? '',
            icon: s.icon ?? '',
            nameAr: s.name ?? s.nameAr ?? '',
            serviceImageURL: rawImage,
            imageSrc: this.resolveImageUrl(rawImage)
          } as Service;
        });
        const pagination = buildPaginationState(payload, pageNumber, pageSize);
        this.totalItems = pagination.totalItems;
        this.hasExactTotal = pagination.hasExactTotal;
        this.hasNextPage = pagination.hasNextPage;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'فشل في تحميل المهن';
        this.loading = false;
        this.hasNextPage = false;
        this.cdr.markForCheck();
      }
    });
  }

  get filteredServices(): Service[] {
    if (!this.searchQuery.trim()) return this.services;
    const q = this.searchQuery.trim().toLowerCase();
    return this.services.filter(s =>
      s.nameAr && s.nameAr.toLowerCase().includes(q)
    );
  }

  // Add Modal
  openAddModal() {
    this.isEditMode = false;
    this.modalService = { id: '', icon: '🔧', nameAr: '' };
    this.isAddEditModalOpen = true;
    this.selectedImageFile = null;
    this.selectedImagePreview = null;
  }

  // Edit Modal
  openEditModal(service: Service) {
    this.isEditMode = true;
    this.modalService = { ...service };
    this.isAddEditModalOpen = true;
    this.selectedImageFile = null;
    this.selectedImagePreview = service.imageSrc || null;
  }

  closeAddEditModal() {
    this.isAddEditModalOpen = false;
    this.selectedImageFile = null;
    this.selectedImagePreview = null;
  }

  saveService() {
    if (!this.isEditMode && !this.selectedImageFile) {
      alert('يرجى اختيار صورة الخدمة');
      return;
    }

    const formData = new FormData();

    if (this.isEditMode) {
      formData.append('service_name', this.modalService.nameAr);
      if (this.selectedImageFile) {
        formData.append('service_image', this.selectedImageFile);
      }

      this.servicesService
        .updateService(this.modalService.id, formData, true)
        .subscribe({
          next: () => {
            this.fetchServices(this.pageNumber, this.pageSize);
            this.closeAddEditModal();
            this.notificationService.success('تم تحديث المهنة بنجاح');
          },
          error: () => alert('فشل في تعديل المهنة')
        });

    } else {
      formData.append('name', this.modalService.nameAr);
      if (this.selectedImageFile) {
        formData.append('ServiceImage', this.selectedImageFile);
      }

      this.servicesService
        .addService(formData, true)
        .subscribe({
          next: () => {
            this.fetchServices(this.pageNumber, this.pageSize);
            this.closeAddEditModal();
            this.notificationService.success('تم إضافة المهنة بنجاح');
          },
          error: () => alert('فشل في إضافة المهنة')
        });
    }
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      this.selectedImageFile = input.files[0];

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedImagePreview = e.target.result;
      };
      reader.readAsDataURL(this.selectedImageFile);
    }
  }

  // Delete Modal
  openDeleteModal(service: Service) {
    this.serviceToDelete = service;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal() {
    this.isDeleteModalOpen = false;
    this.serviceToDelete = null;
  }

  confirmDelete() {
    if (!this.serviceToDelete) return;

    this.servicesService.deleteService(this.serviceToDelete.id).subscribe({
      next: () => {
        this.closeDeleteModal();
        const targetPage = this.services.length === 1 && this.pageNumber > 1 ? this.pageNumber - 1 : this.pageNumber;
        this.fetchServices(targetPage, this.pageSize);
        this.notificationService.success('تم حذف المهنة');
      },
      error: () => alert('فشل في حذف المهنة')
    });
  }

  onPageChange(page: number) {
    this.fetchServices(page, this.pageSize);
  }

  onPageSizeChange(size: number) {
    this.fetchServices(1, size);
  }

  private resolveImageUrl(value?: string | null): string | null {
    if (!value) {
      return null;
    }
    if (/^https?:\/\//i.test(value) || value.startsWith('data:')) {
      return value;
    }
    const base = environment.apiUrl.replace(/\/$/, '');
    const sanitized = value.replace(/^\/+/, '');
    return `${base}/${sanitized}`;
  }
}
