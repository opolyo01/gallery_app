import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

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
    // Fetch categories from the server
    this.http.get<string[]>('http://localhost:3000/categories').subscribe({
      next: (data) => {
        this.categories = data;
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
