import { Component } from '@angular/core';
import { FileService } from '../../services/file.service';
import { HttpErrorResponse, HttpEventType } from '@angular/common/http';
import Swal from 'sweetalert2';
import { CookieService } from 'ngx-cookie-service';
import { NgIf } from '@angular/common';
import { map } from 'rxjs/operators'

@Component({
  selector: 'app-file-uploader',
  standalone: true,
  imports: [NgIf],
  templateUrl: './file-uploader.component.html',
  styleUrl: './file-uploader.component.css'
})
export class FileUploaderComponent {

  private selectedFiles: File[] = [];
  // Percentage of Upload
  public barWidth: string = "0%";
  constructor(private fileService: FileService, private cookie: CookieService) { }

  /*
  onSelectedFile(event: any) {
    const archivo = event.target.files[0];
    const formData = new FormData();
    formData.append('file', archivo);
    // console.log(formData.get('file'));

    this.fileService.uploadFile(formData, '663c1bb3a0d54bf430c63d1f').subscribe(
      (response: any) => {
        console.log(response);
        Swal.fire('Éxito!', response.message, 'success');
      }, (error: HttpErrorResponse) => {
        console.log(error.error.message);
        Swal.fire('Error!', error.error.message, 'error');
      }
    )
  }
  */

  // Select the files
  onFilesSelected(event: any) {
    this.selectedFiles = event.target.files;
  }

  // Upload the files
  onUploadFiles() {
    // Prepare a Form Data to send the files
    const formData = new FormData();

    // Error if no files are selected
    if (this.selectedFiles.length <= 0) {
      Swal.fire('Error!', 'No hay archivos seleccionados', 'error');
    } else {
      // Add each file selected to the Form Data
      for (let file of this.selectedFiles) {
        formData.append('files', file);
      }

      // Sends the file
      // Params: Form Data (Files) / Folder ID / Folder Name / User ID (Token)
      this.fileService.uploadUserFiles(formData, '6649735ec1270fb8a3b767f3', 'Carpeta 2', this.cookie.get('token'))
        .pipe(map(
          // Observe the event to know the progress
          event => {
            // Check if it's progress event
            if (event.type == HttpEventType.UploadProgress) {
              // Get the progress and display it
              this.barWidth = Math.round((100 / (event.total || 0) * event.loaded)) + "%"

              // Get the response
            } else if (event.type == HttpEventType.Response) {
              const response: any = event;
              Swal.fire('Éxito!', response.body.message, 'success').then(_ => {
                this.barWidth = "0%";
              });
            }
          }
        )) // Subscribes to the request to send it
        .subscribe(
          // Gets the regular response, just to get the possible error
          (response: any) => {
            if (response) {
              console.log(response);
            }

            // Error Handler
          }, (error: HttpErrorResponse) => {
            console.log(error.error.message);
            Swal.fire('Error!', error.error.message, 'error').then(_ => { window.location.reload(); });
          }
        );
    }
  }
}
