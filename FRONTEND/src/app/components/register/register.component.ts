import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user';
import { CookieService } from 'ngx-cookie-service';
import { Environment } from '../../../environment';
import { HttpErrorResponse } from '@angular/common/http';
import { FormatService } from '../../services/format.service';



@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
  providers: [UserService, CookieService, FormatService]
})



export class RegisterComponent {

  userForm = new FormGroup({
    name: new FormControl(),
    last_name: new FormControl(),
    email: new FormControl(),
    password: new FormControl(),
    profile_picture: new FormControl('')
  });

  constructor(public router: Router,
    private service: UserService,
    private cookie: CookieService,
    private formatService: FormatService) { }

  registerUser() {
    if (this.formatService.registerFormat(this.userForm)) {
      Swal.fire('Error!', `No se permiten campos en blanco!`, 'error');

    } else if (this.formatService.emailFormat(this.userForm.value.email)) {
      Swal.fire('Error', 'Formato de correo invalido', 'error');

    } else {
      const user: User = {
        name: this.userForm.value.name,
        last_name: this.userForm.value.last_name,
        email: this.userForm.value.email,
        password: this.userForm.value.password,
        profile_picture: ''
      }
      this.service.registerUser(user).subscribe((res: any) => {
        const userID = res.token;
        this.cookie.set('token', userID, Environment.COOKIE_EXPIRE);

        Swal.fire('Éxito', `Usuario creado exitosamente`, 'success').then(() => {
          this.router.navigate(['/']).then(() => location.reload());
        });
      }, (error: HttpErrorResponse) => Swal.fire('ERROR!', `${error.error.message}`,'error'));
    }
  }

}
