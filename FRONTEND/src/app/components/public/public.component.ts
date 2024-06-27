import { Component, OnInit } from '@angular/core';
import { Favorite } from '../../models/favorite';
import { NgIf } from '@angular/common';
import { Environment } from '../../../environment';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { FileService } from '../../services/file.service';
import { FolderService } from '../../services/folder.service';
import { FormatService } from '../../services/format.service';
import { UserService } from '../../services/user.service';
import { Folder } from '../../models/folder';
import { FileModel } from '../../models/file';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { format, parseISO } from 'date-fns';
import Swal from 'sweetalert2';
import { HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { map } from 'rxjs';

@Component({
  selector: 'app-public',
  standalone: true,
  imports: [FormsModule, NgIf, MatIcon],
  templateUrl: './public.component.html',
  styleUrl: './public.component.css'
})
export class PublicComponent implements OnInit {
  // - - - - - [ Private Variables ] - - - - -
  private URL_API = Environment.API_URL
  private currentRoute: string; // Current URL Route
  private currentFolder: string; // Current Folder ID
  private parentFolder: string = ''; // Parent Folder ID
  private currentFolderName: string = ''; // Current Folder Name
  private parentFolderName: string = ''; // Parent Folder Name
  private selectedFiles: File[] = []; // Files to upload to the current Folder


  // - - - - - [ Public Variables ] - - - - -
  public barWidth: string = "0%";
  public progress: number = -1;

  // FOLDER
  public newFolderName: string = ''; // Name for the New Folder to create
  public newUpdateFolderName: string = ''; // New Name for the folder to update
  public publicFolders: Folder[] = []; // User's Folder List for the current folder
  public isHidden: Boolean; // Shows a "Back" button
  public selectedFolderID: string = '';
  public selectedFolderName: string = '';
  public selectedFolderOwner: string = '';

  // FILES
  public publicFiles: FileModel[] = []; // User's Folder List for the current folder
  public newUpdateFileName: string = ''; // New Name for the file to update
  public selectedFileID: string = '';
  public selectedFileName: string = '';
  public selectedFileOwner: string = '';
  public selectedFileExtension: string = '';


  // FAVORITES
  public userFavorites: Favorite[] = []; // Favorite Object List
  public userFavoritesID: string[] = []; // Favorites ID List

  // MAPS
  public showButtons: { [_id: string]: boolean } = {};
  public userName: { [ownerID: string]: boolean } = {};

  // CONSTRUCTOR
  constructor(
    private router: Router,
    private folderService: FolderService,
    private fileService: FileService,
    private userService: UserService,
    private formatService: FormatService,
    private cookie: CookieService,
  ) {
    // Get the current URL
    this.currentRoute = this.router.url;
    // Check if its on the Root (public) directory
    if (this.currentRoute == '/public') {
      this.currentFolder = 'public';
      this.currentFolderName = 'Inicio';
      this.isHidden = true;
      window.document.title = 'Inicio';
    } else {
      this.currentFolder = this.currentRoute.split('public/')[1]
      this.isHidden = false;
    }

  }

  ngOnInit(): void {
    // - - - [ CURRENT FOLDER FOLDERS ] - - - 
    this.folderService.getPublicFolders(this.currentFolder).subscribe(// Get the folder list from the Backend
      (result: any) => {
        // Assigns the folder list to the local list
        this.publicFolders = result;
        // For each folder in the list
        this.publicFolders.forEach(folder => {
          // Formats the time stamp to YYY-MM-YY
          let updatedAt = folder.updatedAt;
          if (updatedAt) folder.updatedAt = format(parseISO(updatedAt), 'yyyy-MM-dd');
          if (!this.userName[folder.owner]) {
            this.userService.getUserName(folder.owner).subscribe((result: any) => {
              result ? this.userName[folder.owner] = result.name : console.log('No hay');
            }, (err: HttpErrorResponse) => {
              console.log(err.error);
              Swal.fire('Error!', err.error.message, 'error');
            });
          }

        });
      }, (error: HttpErrorResponse) => {
        console.log(error.error);
        Swal.fire('Error!', error.error.message);
      });


    // - - - [ CURRENT FOLDER FILES ] - - - 
    // Get the files on the current folder
    this.fileService.getPublicFiles(this.currentFolder).subscribe((result: any) => {
      this.publicFiles = result;
      this.publicFiles.forEach(file => {
        let updatedAt = file.updatedAt;
        file.updatedAt = format(parseISO(updatedAt), 'yyyy-MM-dd');
        if (!this.userName[file.owner]) {
          this.userService.getUserName(file.owner).subscribe((result: any) => {
            result ? this.userName[file.owner] = result.name : console.log('No hay');
          }, (err: HttpErrorResponse) => {
            console.log(err.error);
            Swal.fire('Error!', err.error.message, 'error');
          });
        }
      })
    }, (error: HttpErrorResponse) => {
      console.log(error.error);
      Swal.fire('Error!', error.error.message, 'error');
    });



    // - - - [ CURRENT FOLDER NAME ] - - - 
    // Checks for the current folder
    // If its different from the Root folder
    if (this.currentFolder != 'public') {
      // Gets the name of the current folder from the Backend and DB
      this.folderService.getFolderName(this.currentFolder, this.cookie.get('token')).subscribe(
        (result: any) => {
          // Current folder's name
          this.currentFolderName = result.name;
          // Parent's folder ID for the current folder
          this.parentFolder = result.parent;
          // Set the title for the window
          window.document.title = this.currentFolderName;

          // Check if the parent isn't the Root directory
          if (this.parentFolder != 'public') {
            // Gets the name of the parent folder from the Backend and DB
            this.folderService.getFolderName(this.parentFolder, this.cookie.get('token')).subscribe(
              (result: any) => {
                // Assigns it to the local parent name variable
                this.parentFolderName = result.name;

                // Error Handler
              }, (error: HttpErrorResponse) => {
                Swal.fire('Error!', error.error.message, 'error').then(() => this.router.navigate(['/home']));
              });
            // Otherwise, it's gotta be the Root folder
          } else {
            this.parentFolderName = 'Inicio';
          }

          // Error Handler
        }, (error: HttpErrorResponse) => {
          Swal.fire('Error!', error.error.message, 'error').then(() => this.router.navigate(['/home']));
        });
    }

    this._getFavorites();

  }




  // - - - - - - - - - - [ FOLDERS ] - - - - - - - - - -

  setSelectedFolder(folderID: string, folderName: string, folderOwner: string) {
    this.selectedFolderID = folderID;
    this.selectedFolderName = folderName;
    this.selectedFolderOwner = folderOwner;
  }

  createFolder() {
    this._createFolder();
    this._clearFolderName();
  }

  _createFolder() {
    // Checks if teh folder name is valid
    // Checks if the folder name is empty
    if (!this.newFolderName) {
      Swal.fire('Error!', 'No se permiten campos vacíos!', 'error');
    } else if (!this.formatService.isValidName(this.newFolderName)) {
      Swal.fire('Error!', `El nombre no puede contener ninguno de estos caracteres: \n${this.formatService.getCharList()}`, 'error');
    } else if (this.formatService.hasBorderSpaces(this.newFolderName)) {
      Swal.fire('Error!', `El nombre no puede empezar o terminar con espacios.`, 'error');
    } else {
      // Creates a folder object
      const folder: Folder = {
        _id: '',
        name: this.newFolderName, // Gets it from the input
        owner: '',
        parent: this.currentFolder, // Gets it from the Current Folder Variable
        public: true
      }

      // Calls the service to create a new Folder
      this.folderService.createPublicFolder(folder, this.cookie.get('token')).subscribe(
        (_: any) => {
          this.ngOnInit();
        }, (error: HttpErrorResponse) => {
          Swal.fire('Error!', error.error.message, 'error');
          console.log(error.error.message);

        })
    }
  }

  _clearFolderName() {
    this.newFolderName = ''; // Resets the Folder Name
  }

  deleteFolder(folderID: string, folder_name: string) {
    Swal.fire({
      title: `Eliminar Carpeta`,
      html: `¿Quieres eliminar la carpeta <b>"${folder_name}"</b> y todo su contenido de forma <b>PERMANENTE</b>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f02424',
      cancelButtonColor: '#49a7de',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.folderService.deletePublicFolder(folderID).subscribe(_ => {
          this.ngOnInit();
        }, (error: HttpErrorResponse) => {
          Swal.fire('Error!', error.error.message);
        })
      }
    });
  }



  _clearUpdateFolderName() {
    this.newUpdateFolderName = '';
  }

  _updateFolderName() {
    if (!this.newUpdateFolderName) {
      Swal.fire('Error!', 'No se permiten espacios en blanco', 'error');
    } else if (this.newUpdateFolderName == this.selectedFolderName) {
      Swal.fire('', 'El nombre es el mismo, nada que actualizar', 'info');
    } else if (!this.formatService.isValidName(this.newUpdateFolderName)) {
      Swal.fire('Error!', `El nombre no puede contener ninguno de estos caracteres: \n${this.formatService.getCharList()}`, 'error');
    } else if (this.formatService.hasBorderSpaces(this.newUpdateFolderName)) {
      Swal.fire('Error!', `El nombre no puede empezar o terminar con espacios.`, 'error');
    } else {
      const newName = { newName: this.newUpdateFolderName, oldName: this.selectedFolderName, owner: this.selectedFolderOwner };
      this.folderService.updatePublicFolderName(this.selectedFolderID, newName).subscribe((_: any) => {
        this.ngOnInit();
      }, (error: HttpErrorResponse) => {
        Swal.fire('Error!', error.error.message, 'error');
      });
    }
  }

  updateFolderName() {
    this._updateFolderName();
    this._clearUpdateFolderName();
    this.ngOnInit();
  }

  toggleFavorite(folderID: string) {
    if (this.userFavoritesID.includes(folderID)) {
      this.folderService.removeFromUserFavorites(folderID, this.cookie.get('token')).subscribe(
        _ => {
          this.userFavoritesID.splice(this.userFavoritesID.indexOf(folderID), 1);
          this.ngOnInit();
        }, (error: HttpErrorResponse) => {
          Swal.fire('Error!', error.error.message, 'error');
        }
      );

    } else {
      const selectedFolder: Folder | undefined = this.publicFolders.find(folder => folder._id == folderID);
      if (selectedFolder) {
        this.folderService.addToUserFavorites(folderID, selectedFolder.public, this.cookie.get('token')).subscribe(
          _ => {
            this._getFavorites()
          }, (error: HttpErrorResponse) => {
            Swal.fire('Error!', error.error.message, 'error');
          }
        );
      }
    }
  }

  _buttonFavorites(folderID: string) {
    return this.userFavoritesID.includes(folderID);
  }


  _getFavorites() {
    this.folderService.getUserFavorites(this.cookie.get('token')).subscribe(
      (result: any) => {
        this.userFavorites = result;
        this.userFavorites.forEach(favorite => this.userFavoritesID.push(favorite.folder));
      }, (error: HttpErrorResponse) => {
        Swal.fire('Error', error.error.message, 'error');
      }
    );
  }


  // - - - - - - - - - - [ FILES ] - - - - - - - - - -

  uploadFiles(event: any) {
    // Get the files from the input
    this.selectedFiles = event.target.files;

    // Check if input has files
    if (this.selectedFiles.length > 0) {
      // Create a Form Data to send
      const formData = new FormData();

      // Fills the form data with the files
      for (let file of this.selectedFiles) formData.append('files', file);

      // console.log(`Folder: ${this.currentFolder}, Name: ${this.currentFolderName}`);


      // Calls the service to upload public files
      this.fileService.uploadPublicFiles(formData, this.currentFolder, this.currentFolderName, this.cookie.get('token'))
        .pipe(map(
          // Observe the event to know the progress
          event => {
            // Check if it's progress event
            if (event.type == HttpEventType.UploadProgress) {
              this.barWidth = Math.round((100 / (event.total || 0) * event.loaded)) + "%";

              // Get the response
            } else if (event.type == HttpEventType.Response) {
              const response: any = event;
              Swal.fire('Éxito!', response.body.message, 'success').then(_ => {
                this.barWidth = "0%";
                this.selectedFiles = [];
                window.location.reload();
              })
            }
          }
        )).subscribe((result: any) => {
          if (result) {
            Swal.fire('Bien!', result.message, 'success').then(_ => {
              console.log(result);

            })
          }
        }, (error: HttpErrorResponse) => {
          console.log(error);
          Swal.fire('Error!', error.error.message, 'error').then(_ => {
            window.location.reload();
          });
        });

      this.selectedFiles = [];

    }
  }

  _navigate(folderID: string) {
    this.router.navigate(['/public/', folderID]).then(() => window.location.reload());
  }

  // This stores the file on memory before saving it on the drive
  downloadFile(file_name: string) {
    // Gets the Current Folder Name and concatenate it with the Current Folder ID
    const folder = `${this.currentFolderName}_${this.currentFolder}`;
    // Call the service
    this.fileService.downloadPublicFile(folder, file_name)
      .subscribe(event => { // Observe the event
        if (event.progress !== undefined) {
          this.progress = event.progress; // Gets the Download progress

        } else if (event.file) { // File is ready
          this._downloadFileAux(event.file, file_name);
          this.progress = -1; // Reset progress
          window.location.reload();
        }

        // Error Handler
      }, (error: HttpErrorResponse) => {
        console.log(error);
        Swal.fire('Error!', error.error.message, 'error').then(
          _ => window.location.reload()
        );
      });
  }

  // Don't know what it does, ask ChatGPT
  private _downloadFileAux(blob: Blob, file_name: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file_name; // File Name
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  // api/files/preview/public/:folder/:file_name
  seeFilePreview(file_name: string) {
    const a = document.createElement('a');
    a.href = `${this.URL_API}/files/preview/public/${this.currentFolderName}_${this.currentFolder}/${file_name}`;
    a.target = "_blank";
    a.click();
  }

  showSize(file_size: string): string {
    // Get the size and converts it from a string to a number
    const size: number = parseInt(file_size, 10);

    // If size is less than a Kilobyte
    if (size < 1000) return '1Kb';
    // If size is greater than a Kb and less than a Mb
    if (size > 1000 && size < 1000000) {
      const result = size / 1000;
      return result.toFixed(1) + ' Kb';
      // If size is greater than a Mb and less than a Gb
    } else if (size > 1000000 && size < 1000000000) {
      const result = size / 1000000;
      return result.toFixed(1) + ' Mb';
      // If size is greater than a Gb
    } else {
      const result = size / 1000000000;
      return result.toFixed(1) + ' Gb';
    }
  }

  setSelectedFile(fileID: string, file_name: string, file_extension: string, owner: string) {
    this.selectedFileID = fileID;
    this.selectedFileName = file_name;
    this.selectedFileExtension = file_extension;
    this.selectedFileOwner = owner;
  }

  _clearUpdateFileName() {
    this.newUpdateFileName = '';
  }

  updateFileName() {
    this._updateFileName();
    this._clearUpdateFileName();
    this.ngOnInit();
  }

  _updateFileName() {
    if (!this.newUpdateFileName) {
      Swal.fire('Error!', 'No se permiten espacios en blanco', 'error');
    } else if (this.newUpdateFileName == this.selectedFileName) {
      Swal.fire('', 'El nombre es el mismo, nada que actualizar', 'info');
    } else if (!this.formatService.isValidName(this.newUpdateFileName)) {
      Swal.fire('Error!', `El nombre no puede contener ninguno de estos caracteres: \n${this.formatService.getCharList()}`, 'error');
    } else if (this.formatService.hasBorderSpaces(this.newUpdateFileName)) {
      Swal.fire('Error!', `El nombre no puede empezar o terminar con espacios.`, 'error');
    } else {
      const new_data = {
        folder: this.currentFolder,
        new_name: this.newUpdateFileName,
        old_name: this.selectedFileName,
        owner: this.selectedFileOwner,
        folder_name: this.currentFolderName,
        file_extension: this.selectedFileExtension
      };
      this.fileService.updatePublicFileName(this.selectedFileID, new_data).subscribe((_: any) => {
        this.ngOnInit();
      }, (error: HttpErrorResponse) => {
        console.log(error.error);
        Swal.fire('Error!', error.error.message, 'error');
      });
    }
  }

  deletePublicFile(fileID: string, file_name: string) {
    Swal.fire({
      title: `Eliminar Carpeta`,
      html: `¿Quieres eliminar el archivo <b>"${file_name}"</b> de forma <b>PERMANENTE</b>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f02424',
      cancelButtonColor: '#49a7de',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        // Gets the Current Folder Name and concatenate it with the Current Folder ID
        const folder = `${this.currentFolderName}_${this.currentFolder}`;
        this.fileService.deletePublicFile(folder, fileID).subscribe((_: any) => {
          // Swal.fire('Eliminado!', result.message, 'info');
          this.ngOnInit();
        }, (error: HttpErrorResponse) => {
          Swal.fire('Error!', error.error.message, 'error');
        });
      }
    });
  }


  // - - - - - [ GETTERS ] - - - - -
  getCurrentRoute(): string {
    return this.currentRoute;
  }

  getCurrentFolder(): string {
    return this.currentFolder;
  }

  getParentFolder(): string {
    return this.parentFolder;
  }

  getCurrentFolderName(): string {
    return this.currentFolderName;
  }

  getParentFolderName(): string {
    return this.parentFolderName;
  }
  // - - - - - [ END GETTERS ] - - - - -


  navigatePrivate() {
    this.router.navigate(['/home']);
  }
}
