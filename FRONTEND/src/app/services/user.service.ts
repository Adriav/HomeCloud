import { Injectable } from '@angular/core';
import { Environment } from '../../environment';
import { User } from '../models/user';
import { HttpClient, HttpHeaders } from '@angular/common/http';


/*
  CREAR HEADERS:
  const headers = new HttpHeaders({ 'Authorization': 'Bearer mi_token' });
  return this.http.post(this.URL_API, body, { headers: headers });
*/



@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly URL_API = Environment.API_URL + '/users/';

  constructor(private http: HttpClient) { }

  registerUser(user: User) {
    return this.http.post(this.URL_API + 'register', user);
  }

  authenticateUser(email: string, password: string) {
    return this.http.post(this.URL_API + 'login', { email: email, password: password });
  }

  getProfilePicturePath(token: string) {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.get(this.URL_API + 'get-pfp', { headers: headers });
  }

  validateUser(token: string) {
    return this.http.get(this.URL_API + `validate/${token}`);
  }

  getUser(token: string) {
    return this.http.get(this.URL_API + `get-user/${token}`);
  }

  getUserName(userID: string) {
    return this.http.get(this.URL_API + `get-name/${userID}`);
  }

  updateName(token: String, newName: String) {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.put(this.URL_API + 'update/name', { newName: newName }, { headers: headers });
  }

  updateLastName(token: String, newLastName: String) {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.put(this.URL_API + 'update/last-name', { newLastName: newLastName }, { headers: headers });
  }

  updateEmail(token: String, newEmail: String) {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.put(this.URL_API + 'update/email', { newEmail: newEmail }, { headers: headers });
  }

  updatePassword(token: String, newPassword: String) {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.put(this.URL_API + 'update/password', { newPassword: newPassword }, { headers: headers });
  }

}
