import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { Environment } from '../../../environment';
import { UserService } from '../../services/user.service';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})

export class DashboardComponent implements OnInit {
  isValid: Boolean; // Validate the current token
  private profile_picture_URL: String; // User's profile picture path
  public currentRoute: string;

  constructor(
    private router: Router,
    private cookie: CookieService,
    private userService: UserService,
    private authService: AuthService) {
    this.isValid = false;
    this.profile_picture_URL = '';
    this.currentRoute = router.url;
  }

  ngOnInit(): void {
    this._setProfileIcon()
  }

  _setProfileIcon(): void {
    // Check if there's a session active
    this.isValid = this.authService.isValidUser();

    // Check if the user is logged AND the profile icon is empty
    if (this.isValid && this.profile_picture_URL == '') {

      // Gets the profile picture from the user
      this.userService.getProfilePicturePath(this.cookie.get('token')).subscribe((result: any) => {

        // If the user has a profile picture, assign it to the icon.
        // Otherwise, use the default icon.        
        result.file_URL ? this.profile_picture_URL = result.file_URL : this.profile_picture_URL = Environment.DEFAULT_PROFILE_PNG;

      }, (error: HttpErrorResponse) => {
        console.log(error.error.message);
        this.logOut();
      });
    }
  }

  logOut() {
    // Logging out clears the cookie
    this.cookie.delete('token', '/');

    // Reset the profile picture to NULL
    this.profile_picture_URL = '';

    // Returns to home
    this.router.navigate(['/']);

    // Refresh the dashboard
    this.ngOnInit();
  }

  _getProfilePicture(): String {
    return this.profile_picture_URL;
  }

}
