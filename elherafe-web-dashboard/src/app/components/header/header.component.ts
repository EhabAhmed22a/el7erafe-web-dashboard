import { Component, EventEmitter, Output } from '@angular/core';

@Component({
    selector: 'app-header',
    standalone: true,
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.css']
})
export class HeaderComponent {
    @Output() menuToggle = new EventEmitter<void>();
    title: string = 'Header';

    triggerMenuToggle() {
        this.menuToggle.emit();
    }
}