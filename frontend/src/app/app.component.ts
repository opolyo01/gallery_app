import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [RouterModule, CommonModule], // Import RouterModule and CommonModule
  standalone: true,
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'gallery-front-end';
  menuOpen = false; // Track the state of the hamburger menu

  constructor(private router: Router) {}

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen; // Toggle the menu state
  }

  closeMenu(): void {
    this.menuOpen = false; // Close the menu
  }

  logout(): void {
    localStorage.removeItem('token'); // Remove the token from local storage
    this.router.navigate(['/login']); // Redirect to the login page
  }

  // Check if the current route is login or sign-up
  isAuthRoute(): boolean {
    return this.router.url === '/login' || this.router.url === '/signup';
  }
}
