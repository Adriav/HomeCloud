import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { UserService } from './user.service';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private cookie:CookieService, private userService: UserService) { }

  isValidUser(): Boolean {
    // Gets the session token from cookie
    return this.cookie.get('token') ? true : false;
  }
}
