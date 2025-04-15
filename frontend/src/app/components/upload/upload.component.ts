import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from 'src/environments/environment'; // Import environment

@Component({
  selector: 'app-upload',
  standalone: true,
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss'],
  imports: [CommonModule, FormsModule], // Import FormsModule for two-way binding
})
export class UploadComponent {
  selectedFile: File | null = null;
  category: string = '';
  description: string = '';
  uploadMessage: string = '';

  constructor(private http: HttpClient) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  onUpload(event: Event): void {
    event.preventDefault();
    if (!this.selectedFile || !this.category || !this.description) {
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('category', this.category);
    formData.append('description', this.description);

    // Use the API URL from the environment file
    this.http.post(`${environment.apiUrl}/upload`, formData).subscribe({
      next: (response: any) => {
        this.uploadMessage = `Image uploaded successfully! File URL: ${response.fileUrl}`;
        this.selectedFile = null;
        this.category = '';
        this.description = '';
      },
      error: () => {
        this.uploadMessage = 'Failed to upload image.';
      },
    });
  }
}
