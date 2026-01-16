import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export type ConfirmationVariant = 'primary' | 'danger';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmation-dialog.component.html'
})
export class ConfirmationDialogComponent {
  @Input() title = 'تأكيد الإجراء';
  @Input() message = '';
  @Input() confirmLabel = 'تأكيد';
  @Input() cancelLabel = 'إلغاء';
  @Input() variant: ConfirmationVariant = 'primary';
  @Input() busy = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  get confirmClasses(): string {
    const base = 'px-4 py-2 rounded-md text-sm font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-offset-2';
    if (this.variant === 'danger') {
      return `${base} bg-red-600 hover:bg-red-700 focus:ring-red-500`;
    }
    return `${base} bg-[#3775FA] hover:bg-blue-600 focus:ring-blue-500`;
  }

  get cancelClasses(): string {
    return 'px-4 py-2 rounded-md text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition';
  }

  onConfirm() {
    if (!this.busy) {
      this.confirm.emit();
    }
  }

  onCancel() {
    if (!this.busy) {
      this.cancel.emit();
    }
  }
}
