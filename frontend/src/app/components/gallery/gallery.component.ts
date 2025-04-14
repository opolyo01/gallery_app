import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss'],
  imports: [CommonModule],
})
export class GalleryComponent implements OnInit {
  images: { fileUrl: string; category: string; description: string }[] = [];
  filteredImages: { fileUrl: string; category: string; description: string }[] = [];

  constructor(private http: HttpClient, private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Fetch all images from the server
    this.http.get<{ fileUrl: string; category: string; description: string }[]>('http://localhost:3000/images')
      .subscribe({
        next: (data) => {
          this.images = data;

          // Filter images based on the category from the route
          this.route.params.subscribe(params => {
            const category = params['category'];
            if (category) {
              this.filteredImages = this.images.filter(image => image.category.toLowerCase() === category.toLowerCase());
            } else {
              this.filteredImages = this.images; // Show all images if no category is provided
            }
          });
        },
        error: (err) => {
          console.error('Failed to fetch images:', err);
        },
      });
  }
}
