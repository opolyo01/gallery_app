import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [RouterModule], // Import RouterModule for routing
  standalone: true,
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'gallery-front-end';

  constructor(private router: Router) {}

  logout(): void {
    localStorage.removeItem('token'); // Remove the token from local storage
    this.router.navigate(['/login']); // Redirect to the login page
  }
}
