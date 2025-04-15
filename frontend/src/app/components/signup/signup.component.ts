import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router'; // Import RouterModule
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-signup',
  standalone: true,
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
  imports: [FormsModule, CommonModule, RouterModule], // Add RouterModule here
})
export class SignupComponent {
  username = '';
  password = '';
  successMessage = '';
  errorMessage = '';

  constructor(private http: HttpClient) {}

  onSignup(event: Event): void {
    event.preventDefault();
    this.http.post(`${environment.apiUrl}/signup`, { username: this.username, password: this.password })
      .subscribe({
        next: () => {
          this.successMessage = 'User registered successfully!';
          this.errorMessage = '';
        },
        error: (err) => {
          this.errorMessage = 'Failed to register user.';
          this.successMessage = '';
        },
      });
  }
}
