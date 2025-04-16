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
  selectedFiles: File[] = [];
  category: string = ''; // Optional, default to empty
  description: string = ''; // Optional, default to empty
  uploadMessage: string | null = null;

  constructor(private http: HttpClient) {}

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles = Array.from(input.files); // Store all selected files
    }
  }

  onUpload(event: Event): void {
    event.preventDefault();

    if (this.selectedFiles.length === 0) {
      this.uploadMessage = 'Please select at least one file.';
      return;
    }

    const formData = new FormData();
    this.selectedFiles.forEach((file) => {
      formData.append('files', file); // Append each file to the FormData object
    });

    // Use "default" if category is not provided
    formData.append('category', this.category || 'default');
    formData.append('description', this.description || ''); // Optional description

    const token = localStorage.getItem('token'); // Retrieve the token from localStorage

    this.http.post(`${environment.apiUrl}/upload-multiple`, formData, {
      headers: {
        Authorization: `Bearer ${token}`, // Add the token to the Authorization header
      },
    }).subscribe({
      next: (response) => {
        this.uploadMessage = 'Files uploaded successfully!';
        this.selectedFiles = [];
        this.category = '';
        this.description = '';
      },
      error: (err) => {
        console.error('Upload failed:', err);
        this.uploadMessage = 'Failed to upload files. Please try again.';
      },
    });
  }
}
