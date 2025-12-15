import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { HeaderComponent } from '../../components/header/header.component';
import { Sidebar } from '../../components/sidebar/sidebar.component';
import { ServicesService } from '../../services/services.service';

interface Service {
  id: string;
  icon: string;
  nameAr: string;
  serviceImageURL?: string | null;
}

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [HeaderComponent, Sidebar, FormsModule, CommonModule],
  templateUrl: './services.page.html',
  styleUrls: ['./services.page.css'],
})
export class ServicesPage implements OnInit {

  selectedImageFile: File | null = null;
  selectedImagePreview: string | null = null;

  searchQuery = '';

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

  constructor(private servicesService: ServicesService) {}

  ngOnInit() {
    this.fetchServices();
  }

  fetchServices() {
    this.loading = true;
    this.error = '';

    this.servicesService.getServices().subscribe({
      next: (res) => {
        this.services = (res.services || []).map((s: any) => ({
          id: s.id?.toString() ?? '',
          icon: '',
          nameAr: s.name ?? '',
          serviceImageURL: s.serviceImageURL ?? null,
        }));
        this.loading = false;
      },
      error: () => {
        this.error = 'فشل في تحميل المهن';
        this.loading = false;
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
    this.selectedImagePreview = service.serviceImageURL || null;
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
            this.fetchServices();
            this.closeAddEditModal();
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
            this.fetchServices();
            this.closeAddEditModal();
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
        this.fetchServices();
      },
      error: () => alert('فشل في حذف المهنة')
    });
  }
}
