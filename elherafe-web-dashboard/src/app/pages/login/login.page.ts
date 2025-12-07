import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
	selector: 'app-login',
	templateUrl: './login.page.html',
		styleUrls: ['./login.page.css'],
		standalone: true,
		imports: [CommonModule, FormsModule, RouterModule]
})
export class LoginPage {
	email: string = '';
	password: string = '';

	constructor(private authService: AuthService, private router: Router) {}
	
	onSubmit() {
		console.log('Submitting:', { email: this.email, password: this.password });
		this.authService.login(this.email, this.password).subscribe({
			next: (response) => {
				// Handle successful login, e.g., navigate to dashboard
				console.log('Login success:', response);
				this.router.navigate(['/dashboard-users']);
			},
			error: (error) => {
				// Handle login error, e.g., show error message
				console.error('Login failed', error);
				console.error('Error status:', error.status);
				console.error('Error body:', error.error);
			}
		});
	}
}
