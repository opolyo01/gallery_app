import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss'],
  imports: [CommonModule],
})
export class GalleryComponent implements OnInit {
  images: any[] = [];
  filteredImages: any[] = [];
  selectedImage: any = null; // For lightbox

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadImages();
  }

  loadImages(): void {
    const token = localStorage.getItem('token'); // Retrieve the token from localStorage

    this.http.get<any[]>(`${environment.apiUrl}/images`, {
      headers: {
        Authorization: `Bearer ${token}`, // Add the token to the Authorization header
      },
    }).subscribe({
      next: (data) => {
        this.images = data;
        this.filteredImages = data; // Apply any filtering logic here if needed
      },
      error: (err) => {
        console.error('Failed to load images:', err);
      },
    });
  }

  onDeleteImage(imageId: string): void {
    if (confirm('Are you sure you want to delete this image?')) {
      const token = localStorage.getItem('token');
      this.http.delete(`${environment.apiUrl}/delete-file/${imageId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).subscribe({
        next: () => {
          console.log('Image deleted successfully');
          this.filteredImages = this.filteredImages.filter((image) => image._id !== imageId);
        },
        error: (err) => {
          console.error('Failed to delete image:', err);
        },
      });
    }
  }

  openLightbox(image: any): void {
    this.selectedImage = image; // Set the selected image for the lightbox
  }

  closeLightbox(): void {
    this.selectedImage = null; // Clear the selected image to close the lightbox
  }
}
