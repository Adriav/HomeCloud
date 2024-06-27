import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { FormatService } from '../../services/format.service';
import Swal from 'sweetalert2';
import { HttpErrorResponse } from '@angular/common/http';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  providers: [UserService, CookieService],
})
export class LoginComponent {


  userForm = new FormGroup({
    email: new FormControl(),
    password: new FormControl(),
  });

  constructor(
    private userService: UserService,
    private formatService: FormatService,
    private router: Router,
    private cookie: CookieService
  ) { }

  authenticate() {
    if (this.formatService.loginFormat(this.userForm)) {
      Swal.fire('Error!', 'No se permiten campos vacíos', 'error');
    } else if (this.formatService.emailFormat(this.userForm.value.email)) {
      Swal.fire('Error', 'Formato de correo invalido', 'error');
    } else {
      this.userService.authenticateUser(this.userForm.value.email, this.userForm.value.password).subscribe(
        (result: any) => {
          this.cookie.set('token', result.token);
          this.router.navigateByUrl('/').then(() => location.reload());
        },
        (error: HttpErrorResponse) => { Swal.fire('Error!', error.error.message, 'error') }
      )
    }
  }
}
