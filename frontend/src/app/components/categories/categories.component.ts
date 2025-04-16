import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment'; // Import environment

@Component({
  selector: 'app-categories',
  standalone: true, // Mark as standalone
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss'],
  imports: [CommonModule], // Import CommonModule for *ngFor
})
export class CategoriesComponent implements OnInit {
  categories: string[] = [];

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<string[]>(`${environment.apiUrl}/categories`).subscribe({
      next: (data) => {
        // Normalize categories to lowercase and remove duplicates
        this.categories = [...new Set(data.map((category) => category.toLowerCase()))];
      },
      error: (err) => {
        console.error('Failed to fetch categories:', err);
      },
    });
  }

  viewCategory(category: string): void {
    this.router.navigate(['/gallery', category.toLowerCase()]);
  }
}
