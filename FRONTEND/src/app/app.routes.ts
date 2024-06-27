import { Routes } from '@angular/router';
import { RegisterComponent } from './components/register/register.component';
import { authGuard, tokenGuard } from './guards/auth.guard';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { LoginComponent } from './components/login/login.component';
import { ProfileComponent } from './components/profile/profile.component';
import { HomeComponent } from './components/home/home.component';
import { PublicComponent } from './components/public/public.component';
import { FileUploaderComponent } from './components/file-uploader/file-uploader.component';

export const routes: Routes = [

  {
    path: '',
    component: NotFoundComponent,
    canActivate: [authGuard, tokenGuard]
  }, {
    path: 'register',
    component: RegisterComponent,
    canActivate: [tokenGuard]
  }, {
    path: 'login',
    component: LoginComponent,
    canActivate: [tokenGuard]
  }, {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard]
  }, {
    path: 'upload',
    component: FileUploaderComponent,
  }, {
    path: 'home',
    component: HomeComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '**',
        component: HomeComponent,
      }
    ]
  }, {
    path: 'public',
    component: PublicComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '**',
        component: PublicComponent,
      }
    ]
  },
  {
    path: '**',
    component: NotFoundComponent,
  }
];
