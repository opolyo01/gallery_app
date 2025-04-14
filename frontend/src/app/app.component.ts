import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true, // Mark the component as standalone
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [RouterModule], // Import RouterModule for routing
})
export class AppComponent {
  title = 'gallery-front-end';
}
