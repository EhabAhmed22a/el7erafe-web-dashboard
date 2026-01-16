import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.css'
})
export class PaginationComponent {
  @Input() pageNumber = 1;
  @Input() pageSize = 5;
  @Input() totalItems = 0;
  @Input() pageSizeOptions: number[] = [5, 10, 20, 50];
  @Input() loading = false;
  @Input() showPageSizeSelector = true;
  @Input() exactTotal = true;
  @Input() hasNextPage = false;

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalItems / Math.max(1, this.pageSize)));
  }

  get pageStart(): number {
    if (this.totalItems === 0) {
      return 0;
    }
    return (this.pageNumber - 1) * this.pageSize + 1;
  }

  get pageEnd(): number {
    if (this.totalItems === 0) {
      return 0;
    }
    return Math.min(this.pageNumber * this.pageSize, this.totalItems);
  }

  get visiblePages(): number[] {
    const total = this.totalPages;
    const current = this.pageNumber;
    const pages = new Set<number>([1, total]);

    for (let offset = -2; offset <= 2; offset++) {
      const candidate = current + offset;
      if (candidate > 1 && candidate < total) {
        pages.add(candidate);
      }
    }

    return Array.from(pages).sort((a, b) => a - b);
  }

  get paginationSequence(): Array<number | 'ellipsis'> {
    if (!this.exactTotal) {
      const pages = new Set<number>();
      if (this.pageNumber > 1) {
        pages.add(this.pageNumber - 1);
      }
      pages.add(this.pageNumber);
      if (this.hasNextPage) {
        pages.add(this.pageNumber + 1);
      }
      return Array.from(pages).sort((a, b) => a - b);
    }

    const sequence: Array<number | 'ellipsis'> = [];
    let lastPage: number | null = null;
    for (const page of this.visiblePages) {
      if (lastPage !== null && page - lastPage > 1) {
        sequence.push('ellipsis');
      }
      sequence.push(page);
      lastPage = page;
    }
    return sequence;
  }

  get canGoPrev(): boolean {
    return !this.loading && this.pageNumber > 1;
  }

  get canGoNext(): boolean {
    if (this.loading) {
      return false;
    }
    if (this.exactTotal) {
      return this.pageNumber < this.totalPages;
    }
    return this.hasNextPage;
  }

  goToPage(page: number) {
    if (this.loading) {
      return;
    }
    const safePage = this.exactTotal ? Math.min(Math.max(1, page), this.totalPages) : Math.max(1, page);
    if (safePage !== this.pageNumber) {
      this.pageChange.emit(safePage);
    }
  }

  prevPage() {
    if (this.canGoPrev) {
      this.goToPage(this.pageNumber - 1);
    }
  }

  nextPage() {
    if (this.canGoNext) {
      this.goToPage(this.pageNumber + 1);
    }
  }

  onPageSizeSelect(event: Event) {
    const select = event.target as HTMLSelectElement | null;
    const newSize = Number(select?.value ?? this.pageSize);
    if (!Number.isFinite(newSize) || newSize <= 0) {
      return;
    }
    if (newSize !== this.pageSize) {
      this.pageSize = newSize;
      this.pageSizeChange.emit(newSize);
    }
  }
}
