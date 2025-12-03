import { Component } from '@angular/core';
import { HeaderComponent } from '../../components/header/header.component';
import { Sidebar } from '../../components/sidebar/sidebar.component';

@Component({
  selector: 'app-craftsmen',
  imports: [HeaderComponent, Sidebar],
  templateUrl: './craftsmen.page.html',
  styleUrl: './craftsmen.page.css',
})
export class CraftsmenPage {
  isModalOpen = false;
  selectedCraftsmanName = '';
  selectedDocType: 'front' | 'back' | 'criminal' = 'front';

  openDocumentModal(craftsmanName: string) {
    this.selectedCraftsmanName = craftsmanName;
    this.selectedDocType = 'front';
    this.isModalOpen = true;
  }

  closeDocumentModal() {
    this.isModalOpen = false;
  }
}
