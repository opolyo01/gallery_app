// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { CategoriesComponent } from './components/categories/categories.component';
import { GalleryComponent } from './components/gallery/gallery.component';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { UploadComponent } from './components/upload/upload.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: '', component: GalleryComponent, canActivate: [AuthGuard] },
  { path: 'upload', component: UploadComponent, canActivate: [AuthGuard] },
  { path: 'categories', component: CategoriesComponent, canActivate: [AuthGuard] },
  { path: 'gallery/:category', component: GalleryComponent, canActivate: [AuthGuard] },
];
