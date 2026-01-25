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
	showPassword = false;

	constructor(private authService: AuthService, private router: Router) {}
	
	togglePasswordVisibility() {
		this.showPassword = !this.showPassword;
	}

	onSubmit() {
		console.log('Submitting:', { email: this.email, password: this.password });
		this.authService.login(this.email, this.password).subscribe({
			next: (response) => {
				console.log('Login success:', response);
				
				// Store the token - adjust based on your API response structure
				const token = response.token || response.data?.token || response.accessToken;
				if (token) {
					localStorage.setItem('authToken', token);
					console.log('Token stored successfully');
				} else {
					console.warn('No token found in response:', response);
				}
				
				// Navigate to dashboard
				this.router.navigate(['/dashboard-users']);
			},
			error: (error) => {
				console.error('Login failed', error);
				console.error('Error status:', error.status);
				console.error('Error body:', error.error);
			}
		});
	}
}
