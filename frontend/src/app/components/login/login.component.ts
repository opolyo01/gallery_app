import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [FormsModule, CommonModule, RouterModule],
})
export class LoginComponent {
  username = '';
  password = '';
  errorMessage: string | null = null; // Define the errorMessage property

  constructor(private http: HttpClient, private router: Router) {}

  login(): void {
    this.http
      .post<{ token: string }>(`${environment.apiUrl}/login`, {
        username: this.username,
        password: this.password,
      })
      .subscribe({
        next: (response) => {
          localStorage.setItem('token', response.token); // Save the token
          console.log('Login successful!');
          this.errorMessage = null; // Clear any previous error messages
          this.router.navigate(['/']); // Redirect after login
        },
        error: (err) => {
          console.error('Login failed:', err);
          this.errorMessage = 'Invalid username or password. Please try again.'; // Set the error message
        },
      });
  }
}
