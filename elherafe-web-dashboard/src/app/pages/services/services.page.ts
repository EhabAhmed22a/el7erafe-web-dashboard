import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../components/header/header.component';
import { Sidebar } from '../../components/sidebar/sidebar.component';

interface Service {
  id: number;
  icon: string;
  nameAr: string;
  nameEn: string;
}

@Component({
  selector: 'app-services',
  imports: [HeaderComponent, Sidebar, FormsModule],
  templateUrl: './services.page.html',
  styleUrl: './services.page.css',
})
export class ServicesPage {
  searchQuery = '';
  
  // Modal states
  isAddEditModalOpen = false;
  isDeleteModalOpen = false;
  isEditMode = false;
  
  // Modal data
  modalService: Service = { id: 0, icon: '', nameAr: '', nameEn: '' };
  serviceToDelete: Service | null = null;

  // Sample services data
  services: Service[] = [
    { id: 1, icon: '🔧', nameAr: 'سباك', nameEn: 'Plumber' },
    { id: 2, icon: '⚡', nameAr: 'كهربائي', nameEn: 'Electrician' },
    { id: 3, icon: '🪚', nameAr: 'نجار', nameEn: 'Carpenter' },
    { id: 4, icon: '🎨', nameAr: 'نقاش', nameEn: 'Painter' },
    { id: 5, icon: '❄️', nameAr: 'فني تكييف', nameEn: 'AC Technician' },
    { id: 6, icon: '🧱', nameAr: 'بناء', nameEn: 'Mason' },
    { id: 7, icon: '🔩', nameAr: 'حداد', nameEn: 'Blacksmith' },
    { id: 8, icon: '🪟', nameAr: 'فني ألومنيوم', nameEn: 'Aluminum Technician' },
    { id: 9, icon: '🚿', nameAr: 'فني صرف صحي', nameEn: 'Sanitary Technician' },
    { id: 10, icon: '📺', nameAr: 'فني إلكترونيات', nameEn: 'Electronics Technician' },
    { id: 11, icon: '🧹', nameAr: 'عامل نظافة', nameEn: 'Cleaner' },
    { id: 12, icon: '🏠', nameAr: 'فني ديكور', nameEn: 'Decorator' },
  ];

  get filteredServices(): Service[] {
    if (!this.searchQuery.trim()) {
      return this.services;
    }
    const query = this.searchQuery.toLowerCase();
    return this.services.filter(
      s => s.nameAr.includes(this.searchQuery) || 
           s.nameEn.toLowerCase().includes(query)
    );
  }

  // Add Modal
  openAddModal() {
    this.isEditMode = false;
    this.modalService = { id: 0, icon: '🔧', nameAr: '', nameEn: '' };
    this.isAddEditModalOpen = true;
  }

  // Edit Modal
  openEditModal(service: Service) {
    this.isEditMode = true;
    this.modalService = { ...service };
    this.isAddEditModalOpen = true;
  }

  closeAddEditModal() {
    this.isAddEditModalOpen = false;
  }

  saveService() {
    if (this.isEditMode) {
      // Update existing service
      const index = this.services.findIndex(s => s.id === this.modalService.id);
      if (index !== -1) {
        this.services[index] = { ...this.modalService };
      }
    } else {
      // Add new service
      const newId = Math.max(...this.services.map(s => s.id)) + 1;
      this.services.push({ ...this.modalService, id: newId });
    }
    this.closeAddEditModal();
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
    if (this.serviceToDelete) {
      this.services = this.services.filter(s => s.id !== this.serviceToDelete!.id);
    }
    this.closeDeleteModal();
  }
}
