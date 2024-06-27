import { HttpClient, HttpEventType, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Environment } from '../../environment';
import { map } from 'rxjs';

/*
  CREAR HEADERS:
  const headers = new HttpHeaders({ 'Authorization': 'Bearer mi_token' });
  return this.http.post(this.URL_API, body, { headers: headers });
*/

@Injectable({
  providedIn: 'root'
})
export class FileService {

  private readonly URL_API = Environment.API_URL + '/files/';
  constructor(private http: HttpClient) { }

  uploadFile(file: FormData, token: string) {
    return this.http.post(this.URL_API + 'upload/' + token, file);
  }

  uploadUserFiles(file: FormData, folder: string, folder_name: string, token: string) {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.post(this.URL_API + `upload-user/${folder}/${folder_name}`, file, { headers: headers, reportProgress: true, observe: "events" });
  }

  updateProfilePicture(file: FormData, token: string) {
    return this.http.put(this.URL_API + 'upload/pfp/' + token, file);
  }

  getUserFiles(fileID: string, token: string) {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.get(this.URL_API + 'get-user/' + fileID, { headers: headers });
  }

  updateUserFileName(fileID: string, new_data: any) {
    return this.http.put(this.URL_API + `update/name/user/${fileID}`, new_data);
  }

  downloadUserFile(folder: string, file_name: string, token: string) {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.get(this.URL_API + `download/user/${folder}/${file_name}`, {
      headers: headers,
      responseType: 'blob',
      observe: 'events',
      reportProgress: true
    })
      .pipe(
        map(event => this.getEventMessage(event))
      );
  }

  private getEventMessage(event: any): any {
    switch (event.type) {
      case HttpEventType.DownloadProgress:
        return { progress: Math.round(100 * event.loaded / event.total) };
      case HttpEventType.Response:
        return { file: event.body };
      default:
        return `Unhandled event: ${event.type}`;
    }
  }

  deleteUserFile(folder: string, fileID: string, token: string) {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.delete(this.URL_API + `delete/user/${folder}/${fileID}`, { headers: headers });
  }

  getUserFilePreview(owner: string, folder: string, file_name: string) {
    return this.http.get(`/preview/user/${owner}/${folder}/${file_name}`);
  }


  // - - - - - - - - - - [ PUBLIC FILES ] - - - - - - - - - -
  uploadPublicFiles(file: FormData, folder: string, folder_name: string, token: string) {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.post(this.URL_API + `upload-public/${folder}/${folder_name}`, file, { headers: headers, reportProgress: true, observe: "events" });
  }

  getPublicFiles(fileID: string) {
    return this.http.get(this.URL_API + 'get-public/' + fileID);
  }

  updatePublicFileName(fileID: string, new_data: any) {
    return this.http.put(this.URL_API + `update/name/public/${fileID}`, new_data);
  }

  deletePublicFile(folder: string, fileID: string) {
    return this.http.delete(this.URL_API + `delete/public/${folder}/${fileID}`);
  }

  downloadPublicFile(folder: string, file_name: string) {
    return this.http.get(this.URL_API + `download/public/${folder}/${file_name}`, {
      responseType: 'blob',
      observe: 'events',
      reportProgress: true
    })
      .pipe(
        map(event => this.getEventMessage(event))
      );
  }

  getPublicFilePreview(folder: string, file_name: string) {
    return this.http.get(`/preview/public/${folder}/${file_name}`);
  }

}
