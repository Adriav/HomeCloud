import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Environment } from '../../environment';
import { Folder } from '../models/folder';

@Injectable({
  providedIn: 'root'
})
export class FolderService {

  private readonly URL_API = Environment.API_URL + '/folders/';
  constructor(private http: HttpClient) { }

  // - - - - - [ PRIVATE ] - - - - -
  createUserFolder(folder: Folder, token: string) {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.post(this.URL_API + 'create/private', folder, { headers: headers });
  }

  getUserFolders(parent: string, token: string) {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.get(this.URL_API + `private/${parent}`, { headers: headers });
  }

  getFolderName(folderID: string, token: string) {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.get(this.URL_API + `user/name/current/${folderID}`, { headers: headers });
  }

  updateUserFolderName(folderID: string, newName: any) {
    return this.http.put(this.URL_API + 'update/name/user/' + folderID, newName);
  }

  deleteUserFolder(folderID: string) {
    return this.http.delete(this.URL_API + `delete/user/${folderID}`);
  }

  getUserFavorites(token: string) {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.get(this.URL_API + '/favorite/user', { headers: headers });
  }

  addToUserFavorites(folderID: string, isPublic: boolean, token: string) {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.post(this.URL_API + `favorite/${folderID}`, { isPublic }, { headers: headers });
  }

  removeFromUserFavorites(folderID: string, token: string) {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.delete(this.URL_API + `/favorite/delete/${folderID}`, { headers: headers });
  }


  // - - - - - [ PUBLIC ] - - - - -
  createPublicFolder(folder: Folder, token: string) {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.post(this.URL_API + 'create/public', folder, { headers: headers });
  }

  getPublicFolders(parent: string) {
    return this.http.get(this.URL_API + `public/${parent}`);
  }

  deletePublicFolder(folderID: string) {
    return this.http.delete(this.URL_API + `delete/public/${folderID}`);
  }

  updatePublicFolderName(folderID: string, newName: any) {
    return this.http.put(this.URL_API + 'update/name/public/' + folderID, newName);
  }

}
