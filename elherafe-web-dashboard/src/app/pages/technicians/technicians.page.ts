  
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HeaderComponent } from '../../components/header/header.component';
import { Sidebar } from '../../components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { TechniciansService } from '../../services/technicians.service';

@Component({
  selector: 'app-technicians',
  standalone: true,
  imports: [HeaderComponent, Sidebar, CommonModule],
  templateUrl: './technicians.page.html',
  styleUrl: './technicians.page.css',
})
export class TechniciansPage implements OnInit {
    environment = environment;
  technicians: any[] = [];
  loading = true;
  error = '';

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

  fetchTechnicians() {
    this.loading = true;
    this.error = '';
    console.log('Fetching technicians...');
    this.techniciansService.getTechnicians().subscribe({
      next: (response: any) => {
        console.log('Technicians API response:', response);
        this.technicians = response.data;
        console.log('Technicians array:', this.technicians);
        this.loading = false;
        this.cdr.markForCheck();
        setTimeout(() => console.log('DEBUG after loading=false:', this.loading, this.technicians.length), 0);
      },
      error: (err) => {
        console.error('Error loading technicians:', err);
        this.error = 'Failed to load technicians';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  deleteTechnician(id: string) {
    if (confirm('هل أنت متأكد من حذف هذا الفني؟')) {
      this.techniciansService.deleteTechnician(id).subscribe({
        next: () => {
          this.technicians = this.technicians.filter(t => t.id !== id);
        },
        error: () => {
          alert('فشل في حذف الفني');
        }
      });
    }
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
}
