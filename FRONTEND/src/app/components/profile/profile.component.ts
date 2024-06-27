import { Component, OnInit } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { Environment } from '../../../environment';
import { HttpErrorResponse } from '@angular/common/http';
import { MatIcon } from '@angular/material/icon';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { FormatService } from '../../services/format.service';
import { FileService } from '../../services/file.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [MatIcon, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  // Private Variables
  private user: any; // User object
  private profile_picture_URL: String; // Profile Picture to show in <img />
  private token: string; // Session Token, contains the UserID encrypted
  private isValid: Boolean; // The session token is valid
  private selectedFile: File | null = null;

  // Public Variables
  public default_pfp: String = Environment.DEFAULT_PROFILE_PNG; // Default profile icon
  public editName: Boolean = false; // Toggle Edit Name
  public editLastName: Boolean = false; // Toggle Edit Last Name
  public editEmail: Boolean = false; // Toggle Edit Email

  // Edit User Form
  public userForm = new FormGroup({
    new_name: new FormControl(''),
    new_last_name: new FormControl(''),
    new_email: new FormControl(''),
    new_password: new FormControl(''),
    repeat_password: new FormControl('')
  })


  constructor(
    private userService: UserService,
    private authService: AuthService,
    private formatService: FormatService,
    private fileService: FileService,
    private cookie: CookieService,
    private router: Router) {

    this.token = cookie.get('token');
    this.profile_picture_URL = '';
    this.isValid = false;
  }

  ngOnInit(): void {
    // Check if there's a session active
    this.isValid = this.authService.isValidUser();
    this.userService.getUser(this.token).subscribe((result: any) => {
      this.user = result;
      this._setProfilePicture(this.user.profile_picture);


    }, (error: HttpErrorResponse) => {
      console.log(error.error.message);
      this.router.navigateByUrl('/').then(() => this.cookie.deleteAll('/'));
    });
  }


  _setProfilePicture(profile_picture: string): void {
    if (profile_picture != '') {
      this.profile_picture_URL = Environment.USER_PICTURE + `${this.user._id}/${this.user.profile_picture}`;
    } else {
      this.profile_picture_URL = Environment.DEFAULT_PROFILE_PNG;
    }
  }


  logOut() {
    // Logging out clears the cookie
    this.cookie.delete('token', '/');

    // Reset the profile picture to NULL
    this.profile_picture_URL = '';

    // Returns to home
    this.router.navigate(['/']);
  }

  _getProfilePicture(): String {
    return this.profile_picture_URL;
  }

  _getUser() {
    return this.user;
  }

  _getFromUser(field: string) {
    try {
      switch (field) {
        case 'name': return this.user.name;
        case 'last_name': return this.user.last_name;
        case 'email': return this.user.email;
        case 'pfp': return this.user.profile_picture;
      }
    } catch (error) {
      return '';
    }
  }

  _toggleEdit(field: string) {
    switch (field) {
      case 'name': this.editName = !this.editName; break;
      case 'last_name': this.editLastName = !this.editLastName; break;
      case 'email': this.editEmail = !this.editEmail; break;
    }
  }

  _saveEdit(field: string) {
    switch (field) {
      // Edit Name
      case 'name':
        if (!this.userForm.value.new_name) {
          Swal.fire('Error!', `No se permiten campos en blanco!`, 'error');

        } else {
          this.userService.updateName(this.cookie.get('token'), this.userForm.value.new_name).subscribe((result: any) => {
            Swal.fire('Actualizado!', result.message, 'success').then(() => window.location.reload());

          }, (error: HttpErrorResponse) => {
            console.log(error);
            Swal.fire('Error!', error.error.message, 'error');
          });
        }
        break;

      // Edit Last Name
      case 'last_name':
        if (!this.userForm.value.new_last_name) {
          Swal.fire('Error!', `No se permiten campos en blanco!`, 'error');

        } else {
          this.userService.updateLastName(this.cookie.get('token'), this.userForm.value.new_last_name).subscribe(
            (result: any) => {
              Swal.fire('Actualizado!', result.message, 'success').then(() => window.location.reload());

            }, (error: HttpErrorResponse) => {
              console.log(error);
              Swal.fire('Error!', error.error.message, 'error');
            }

          )
        }
        break;

      // Edit Email
      case 'email':
        if (!this.userForm.value.new_email) {
          Swal.fire('Error!', `No se permiten campos en blanco!`, 'error');

        } else {
          this.userService.updateEmail(this.cookie.get('token'), this.userForm.value.new_email).subscribe((result: any) => {
            Swal.fire('Actualizado!', result.message, 'success').then(() => window.location.reload());

          }, (error: HttpErrorResponse) => {
            console.log(error);
            Swal.fire('Error!', error.error.message, 'error');
          })
        }
        break;
      default:
        break;
    }
  }

  _changePassword() {
    // Checks the format for the password, returns a number
    const pFormat = this.formatService.passwordFormat(this.userForm);

    // 4: Both fields are blank, nothing to do... (That's why there's no case 4)
    switch (pFormat) {
      case 3: // 3: There's a field left blank
        Swal.fire('Error!', `No se permiten campos en blanco!`, 'error'); break;

      case 2: // 2: There's a mismatch
        Swal.fire('Error!', `Las contraseñas no coinciden!`, 'error'); break;

      case 1: // 1: Both passwords match
        if (this.userForm.value.new_password) {
          this.userService.updatePassword(this.cookie.get('token'), this.userForm.value.new_password).subscribe((result: any) => {
            Swal.fire('Actualizado!', result.message, 'success');

          }, (error: HttpErrorResponse) => {
            console.log(error);
            Swal.fire('Error!', error.error.message, 'error');
          });
        }
        break;

      default:
        break;
    }
  }

  _onFileSelected(event: any) {
    this.selectedFile = <File>event.target.files[0];
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    const token = this.cookie.get('token');
    this.fileService.updateProfilePicture(formData, token).subscribe(
      (result: any) => {
        Swal.fire('Listo!', result.message, 'success').then(() => window.location.reload())
      }, (error: HttpErrorResponse) => {
        console.log(error.error.message);
        Swal.fire('Error', error.error.message, 'error').then(() => this.selectedFile = null);
      }
    )
  }


}
