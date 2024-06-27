const multer = require('multer');
const tokenManager = require('../token');
const User = require('../models/user.model');
const File = require('../models/file.model');
const path = require('path');
const fs = require('fs');


const fileController = {}
// /media/myfiles/HomeCloud/BACKEND/src/assets/
const FILES_PATH = process.env.FILES_PATH;

// GET - api/files/get-pfp/:fileName
// Header = UserID (Token)
fileController.getProfilePicture = (req, res) => {
  try {
    const userID = req.params.userID;
    const fileName = req.params.fileName;
    if (!userID || !fileName) return res.status(401).send({ message: 'No autorizado' });
    // CURRENT = /media/myfiles/Notavila/BACKEND/src/assets/pfp/:id/:filename
    return res.sendFile(`${FILES_PATH}/pfp/${userID}/${fileName}`);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: 'Error en el Catch' });
  }


}


// POST - api/files/upload/:id
// id: User ID on URL (Params)
fileController.uploadFile = (req, res) => {
  const userID = req.params.id;
  console.log('Single Upload\n');
  // res.send({ message: 'Ta bien...' });

  // Multer disk storage configuration
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      // Define la ruta de destino del archivo
      cb(null, `./src/assets/${userID}`);
    },
    filename: function (req, file, cb) {
      // Define el nombre del archivo en el servidor
      cb(null, file.originalname);
    }
  });

  // Creates a Multer instance with the correct configuration
  const upload = multer({ storage }).single('file');
  upload(req, res, function (err) {
    // File Error
    if (!req.file) return res.status(400).send({ message: 'Error al subir archivo' });

    // Multer Error
    if (err instanceof multer.MulterError) return res.status(500).json({ error: err.message });

    // Other Error
    if (err) return res.status(500).json({ error: err.message });

    // Successful Upload
    return res.status(200).json({ message: 'Archivo subido correctamente' });
  });
}


// POST - api/files/upload-user/:id/:name
// folder: Folder ID (Params)
// userID: User ID (Header)
fileController.uploadUserFiles = async (req, res) => {
  try {
    // Gets the necessary information from the request
    const owner = tokenManager.getFromHeader(req.headers['authorization']); // User ID
    const folderID = req.params.id; // Folder ID
    const folderName = req.params.name; // Folder Name
    // Check for fields
    if (!owner || !folderID || !folderName) return res.status(500).send({ message: 'Error al obtener información de archivo' });

    // Set the folder path to save the file
    let folderPath;
    // IF 'Home' = Root Directory
    if (folderID == 'home') {
      folderPath = path.join(__dirname, '../assets/', owner);

      // Else, Specific Directory
    } else {
      folderPath = path.join(__dirname, '../assets/', owner, `${folderName}_${folderID}`);
    }

    // Multer disk storage configuration
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        // Define la ruta de destino del archivo
        cb(null, folderPath);
      },
      filename: function (req, file, cb) {
        // Define el nombre del archivo en el servidor
        cb(null, file.originalname);
      }
    });

    // Creates a Multer instance with the correct configuration
    const upload = multer({ storage }).array('files');
    upload(req, res, function (err) {
      // Multer Error
      if (err instanceof multer.MulterError) return res.status(500).send({ message: err.message });

      // Other error
      if (err) return res.status(500).send({ message: err.message });

      // Creates a File model for each file uploaded
      req.files.forEach(file => {
        const newFile = new File({
          owner: owner,
          file_name: file.originalname,
          extension_type: path.extname(file.originalname),
          size: file.size,
          folder: folderID,
          public: false
        });

        // Saves the file on the DB
        newFile.save();
      });

      // Successful upload
      return res.status(200).send({ message: 'Archivo(s) subido(s) correctamente!' });
    });

    // Error Handler
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'Error en el CATCH' });
  }
}


// PUT - api/files/upload/pfp/:id
// id: User ID on URL (Params)
fileController.updateProfilePicture = async (req, res) => {
  try {
    // Get the User ID from the URL
    const userID = tokenManager.getFromURL(req.params);
    // Checks if ID is correct
    if (!userID) return res.status(500).send({ message: 'Error en el usuario' });

    // Multer disk storage configuration
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        // Define la ruta de destino del archivo
        cb(null, `./src/assets/pfp/${userID}`);
      },
      filename: function (req, file, cb) {
        // Define el nombre del archivo en el servidor
        cb(null, file.originalname);
      }
    });

    const upload = multer({ storage }).single('file');
    upload(req, res, function (err) {
      // File error
      if (!req.file) return res.status(400).send({ message: 'Error al subir archivo' });

      // Multer Error
      if (err instanceof multer.MulterError) return res.status(500).send({ message: err.message });

      // Other error
      if (err) return res.status(500).send({ message: err.message });

      // Successful upload
      const new_profile_picture = req.file.originalname;
      User.findByIdAndUpdate(userID, { profile_picture: new_profile_picture }).then((user) => {
        if (!user) return res.status(404).send({ message: 'Usuario no encontrado (?)' });
        return res.status(200).send({ message: 'Foto de perfil actualizada correctamente' });
      }).catch((err) => {
        console.log(err);
        return res.status(500).send({ message: 'Error al actualizar foto de perfil (DB)' });
      });
    });

  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: 'Error al cargar foto de perfil (S)' });
  }
}


// GET - api/files/get-user/:id
// :id = Folder ID - Owner = User ID (Token)
fileController.getUserFiles = async (req, res) => {
  try {
    // Folder ID from URL
    const folderID = req.params.id;
    // Owner = User ID from Token
    const owner = tokenManager.getFromHeader(req.headers['authorization']); // User ID
    if (!folderID || !owner) return res.status(500).send({ message: 'No se pudo encontrar la carpeta con archivos' });

    await File.find({ folder: folderID, owner: owner }).sort({ file_name: 1 })
      .then((files) => { return res.status(200).json(files) })
      .catch((err) => { console.log(err); return res.status(500).send({ message: 'Error al obtener archivos (cDB)' }) });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: 'Error al obtener archivos (Catch)' });
  }
}


// PUT - api/files/update/user/name/:id
// :id = Folder ID
fileController.updateUserFile = async (req, res) => {
  try {
    const fileID = req.params.id; // File ID
    const folderID = req.body.folder; // Folder ID containing the file
    const newFileName = req.body.new_name + req.body.file_extension; // New Name + Fiel Extension
    const oldFileName = req.body.old_name; // Old Name
    const owner = req.body.owner; // Gets the User ID as the owner from the body

    // Check for empty fields
    if (!fileID || !folderID || !newFileName || !oldFileName) return res.status(500)
      .send({ message: 'Error al cambiar nombre del archivo' });

    // return res.send({ message: 'Ta bien' });


    // Check for ROOT directory
    if (folderID == 'home') {
      // Creates the path for the previous folder name
      const old_file_path = path.join(__dirname, '../assets/', owner, oldFileName);
      // Creates the path for the previous folder name
      const new_file_path = path.join(__dirname, '../assets/', owner, newFileName);

      // Saves the change on the DB
      await File.findByIdAndUpdate(fileID, { file_name: newFileName }).then((file) => {
        // If no file found, return error
        if (!file) return res.status(500).send({ message: 'Error al actualizar el nombre (DB)' });

        // Renames the File on the file system
        fs.renameSync(old_file_path, new_file_path);
        // Returns success
        return res.status(200).send({ message: 'Nombre actualizado con éxito!' });

        // Error Handler
      }).catch((err) => {
        console.log(err);
        return res.status(500).send({ message: 'Error al actualizar el nombre (cDB)' });
      });

    } else {
      // Creates the path for the previous folder name
      const old_file_path = path.join(__dirname, '../assets/', owner, folderID, oldFileName);
      // Creates the path for the previous folder name
      const new_file_path = path.join(__dirname, '../assets/', owner, folderID, newFileName);

      // Saves the change on the DB
      await File.findByIdAndUpdate(fileID, { file_name: newFileName }).then((file) => {
        // If no file found, return error
        if (!file) return res.status(500).send({ message: 'Error al actualizar el nombre (DB)' });

        // Renames the File on the file system
        fs.renameSync(old_file_path, new_file_path);
        // Returns success
        return res.status(200).send({ message: 'Nombre actualizado con éxito!' });

        // Error Handler
      }).catch((err) => {
        console.log(err);
        return res.status(500).send({ message: 'Error al actualizar el nombre (cDB)' });
      });

    }


  } catch (error) {
    console.log(err);
    return res.status(500).send({ message: 'Error al actualizar el nombre (Catch)' });
  }
}

// GET - api/files/preview/user/:owner/:folder/:file_name
// :folder = Folder ID - :file_name = File Name .ext - :owner = User ID (URL)
fileController.getUserFilePreview = (req, res) => {
  try {
    const owner = req.params.owner
    const folder = req.params.folder; // Folder ID || 'home' (Root)
    const file_name = req.params.file_name; // File Name + Extension

    // Validate info
    if (!owner || !folder || !file_name) return res.status(401).send({ message: 'No autorizado' });
    // Check for Root folder
    if (folder == 'Inicio_home') {
      return res.sendFile(`${FILES_PATH}/${owner}/${file_name}`);
    } else {
      return res.sendFile(`${FILES_PATH}/${owner}/${folder}/${file_name}`);
    }

  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: 'Error al obtener archivo (Catch)' });
  }
}



// GET - api/files/download/user/:folder/:file_name
// :folder = Folder ID - :file_name = File Name .ext - owner = User ID (Token)
fileController.downloadUserFile = (req, res) => {
  try {
    const owner = tokenManager.getFromHeader(req.headers['authorization']); // User ID
    const folder = req.params.folder; // Folder ID || 'home' (Root)
    const file_name = req.params.file_name; // File Name + Extension

    // Validate info
    if (!owner || !folder || !file_name) return res.status(401).send({ message: 'No autorizado' });

    // Check for Root folder
    if (folder == 'Inicio_home') {
      return res.sendFile(`${FILES_PATH}/${owner}/${file_name}`);
    } else {
      return res.sendFile(`${FILES_PATH}/${owner}/${folder}/${file_name}`);
    }

  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: 'Error al descargar el archivo (Catch)' });
  }
}

// DELETE - api/files/delete/user/:folder/:id
// :id = File ID - User ID = TOKEN
fileController.deleteUserFile = async (req, res) => {
  try {
    const owner = tokenManager.getFromHeader(req.headers['authorization']); // User ID
    const folder = req.params.folder; // Folder Name_ID
    const fileID = req.params.id; // File ID

    // Check for complete data
    if (!owner || !folder || !fileID) return res.status(500).send({ message: 'No se pudo encontrar el archivo' });

    // Check for Fine in the Root folder
    if (folder == 'Inicio_home') {
      await File.findOneAndDelete({ _id: fileID, owner: owner }).then((file) => {
        // Check if file exists
        if (!file) return res.status(500).send({ message: 'Archivo no encontrado (DB)' });
        // Gets the File Path
        const file_path = path.join(__dirname, '../assets/', owner, file.file_name);
        // Deletes the File from the File System
        fs.rm(file_path, { force: true }, (err) => {
          if (err) { // Error Handler
            console.log('Error en FS\n', err);
            return res.status(500).send({ message: 'Archivo no encontrado (FS)' });
          } else {
            // Successful DELETE
            return res.send({ message: 'Archivo eliminado correctamente' });
          }
        });
      });

      // Not in Root folder
    } else {
      await File.findOneAndDelete({ _id: fileID, owner: owner }).then((file) => {
        // Check if file exists
        if (!file) return res.status(500).send({ message: 'Archivo no encontrado (DB)' });
        // Gets the File Path
        const file_path = path.join(__dirname, '../assets/', owner, folder, file.file_name);
        // Deletes the File from the File System
        fs.rm(file_path, { force: true }, (err) => {
          if (err) { // Error Handler
            console.log('Error en FS\n', err);
            return res.status(500).send({ message: 'Archivo no encontrado (FS)' });
          } else {
            // Successful DELETE
            return res.send({ message: 'Archivo eliminado correctamente' });
          }
        });
      });
    }
    // Error Handler
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: 'Error al eliminar el archivo (Catch)' });
  }
}


// - - - - - - - - - - [ PUBLIC FILES ] - - - - - - - - - -

// POST - api/files/upload-public/:id/:name
// :id = Folder ID (Params)
// :name = Folder Name (Params)
// owner: User ID (Header)
fileController.uploadPublicFiles = async (req, res) => {
  try {
    // Gets the necessary information from the request
    const owner = tokenManager.getFromHeader(req.headers['authorization']); // User ID
    const folderID = req.params.id; // Folder ID
    const folderName = req.params.name; // Folder Name

    // Check valid data
    if (!owner || !folderID || !folderName) return res.status(500).send({ message: 'Error al obtener información de archivo' });

    // Set the folder path to save the file
    let folderPath;
    // IF 'Public' = Root Directory
    /*
    if (folderID == 'public') {
      folderPath = path.join(__dirname, '../assets/public/');

      // Else, Specific Directory
    } else {
      folderPath = path.join(__dirname, '../assets/public/', `${folderName}_${folderID}`);
    }
    */
    folderID == 'public' ? folderPath = path.join(__dirname, '../assets/public/') : folderPath = path.join(__dirname, '../assets/public/', `${folderName}_${folderID}`);

    // Multer disk storage configuration
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        // Define la ruta de destino del archivo
        cb(null, folderPath);
      },
      filename: function (req, file, cb) {
        // Define el nombre del archivo en el servidor
        cb(null, file.originalname);
      }
    });

    // Creates a Multer instance with the correct configuration
    const upload = multer({ storage }).array('files');
    upload(req, res, function (err) {
      // Multer Error
      if (err instanceof multer.MulterError) return res.status(500).send({ message: err.message });

      // Other error
      if (err) return res.status(500).send({ message: err.message });

      // Creates a File model for each file uploaded
      req.files.forEach(file => {
        const newFile = new File({
          owner: owner,
          file_name: file.originalname,
          extension_type: path.extname(file.originalname),
          size: file.size,
          folder: folderID,
          public: true
        });

        // Saves the file in the DB
        newFile.save();
      });

      // Successful upload
      return res.status(200).send({ message: 'Archivo(s) subido(s) correctamente!' });
    });


  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'Error en el CATCH' });
  }
}


// GET - api/files/get-public/:id
// :id = Folder ID
fileController.getPublicFiles = async (req, res) => {
  try {
    // Folder ID from URL
    const folderID = req.params.id;
    if (!folderID) return res.status(500).send({ message: 'No se pudo encontrar la carpeta con archivos' });

    await File.find({ folder: folderID, public: true }).sort({ file_name: 1 })
      .then((files) => { return res.status(200).json(files) })
      .catch((err) => { console.log(err); return res.status(500).send({ message: 'Error al obtener archivos (cDB)' }) });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: 'Error al obtener archivos (Catch)' });
  }
}


// PUT - api/files/update/public/name/:id
// :id = Folder ID
fileController.updatePublicFile = async (req, res) => {
  try {
    const fileID = req.params.id; // File ID
    const folderID = req.body.folder; // Folder ID containing the file
    const newFileName = req.body.new_name + req.body.file_extension; // New Name + Fiel Extension
    const oldFileName = req.body.old_name; // Old Name
    // const owner = req.body.owner; // Gets the User ID as the owner from the body

    // Check for empty fields
    if (!fileID || !folderID || !newFileName || !oldFileName) return res.status(500)
      .send({ message: 'Error al cambiar nombre del archivo' });

    // Check for ROOT directory
    if (folderID == 'public') {
      // Creates the path for the previous folder name
      const old_file_path = path.join(__dirname, '../assets/public/', oldFileName);
      // Creates the path for the previous folder name
      const new_file_path = path.join(__dirname, '../assets/public/', newFileName);

      // Saves the change on the DB
      await File.findByIdAndUpdate(fileID, { file_name: newFileName }).then((file) => {
        // If no file found, return error
        if (!file) return res.status(500).send({ message: 'Error al actualizar el nombre (DB)' });

        // Renames the File on the file system
        fs.renameSync(old_file_path, new_file_path);
        // Returns success
        return res.status(200).send({ message: 'Nombre actualizado con éxito!' });

        // Error Handler
      }).catch((err) => {
        console.log(err);
        return res.status(500).send({ message: 'Error al actualizar el nombre (cDB)' });
      });

    } else {
      // Creates the path for the previous folder name
      const old_file_path = path.join(__dirname, '../assets/public/', folderID, oldFileName);
      // Creates the path for the previous folder name
      const new_file_path = path.join(__dirname, '../assets/public/', folderID, newFileName);

      // Saves the change on the DB
      await File.findByIdAndUpdate(fileID, { file_name: newFileName }).then((file) => {
        // If no file found, return error
        if (!file) return res.status(500).send({ message: 'Error al actualizar el nombre (DB)' });

        // Renames the File on the file system
        fs.renameSync(old_file_path, new_file_path);
        // Returns success
        return res.status(200).send({ message: 'Nombre actualizado con éxito!' });

        // Error Handler
      }).catch((err) => {
        console.log(err);
        return res.status(500).send({ message: 'Error al actualizar el nombre (cDB)' });
      });

    }

  } catch (error) {
    console.log(err);
    return res.status(500).send({ message: 'Error al actualizar el nombre (Catch)' });
  }
}


// DELETE - /delete/public/:folder/:id
// :folder = Folder Name_ID - :id = File ID
fileController.deletePublicFile = async (req, res) => {
  try {
    const folder = req.params.folder; // Folder Name_ID
    const fileID = req.params.id; // File ID

    // Check for complete data
    if (!folder || !fileID) return res.status(500).send({ message: 'No se pudo encontrar el archivo' });

    // Check for Fine in the Root folder
    if (folder == 'Inicio_public') {
      await File.findOneAndDelete({ _id: fileID, public: true }).then((file) => {
        // Check if file exists
        if (!file) return res.status(500).send({ message: 'Archivo no encontrado (DB)' });
        // Gets the File Path
        const file_path = path.join(__dirname, '../assets/public/', file.file_name);
        // Deletes the File from the File System
        fs.rm(file_path, { force: true }, (err) => {
          if (err) { // Error Handler
            console.log('Error en FS\n', err);
            return res.status(500).send({ message: 'Archivo no encontrado (FS)' });
          } else {
            // Successful DELETE
            return res.status(201).send({ message: 'Archivo eliminado correctamente' });
          }
        });
      });

      // Not in Root folder
    } else {
      await File.findOneAndDelete({ _id: fileID, public: true }).then((file) => {
        // Check if file exists
        if (!file) return res.status(500).send({ message: 'Archivo no encontrado (DB)' });
        // Gets the File Path
        const file_path = path.join(__dirname, '../assets/public/', folder, file.file_name);
        // Deletes the File from the File System
        fs.rm(file_path, { force: true }, (err) => {
          if (err) { // Error Handler
            console.log('Error en FS\n', err);
            return res.status(500).send({ message: 'Archivo no encontrado (FS)' });
          } else {
            // Successful DELETE
            return res.status(201).send({ message: 'Archivo eliminado correctamente' });
          }
        });
      });
    }
    // Error Handler
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: 'Error al eliminar el archivo (Catch)' });
  }
}


// GET - api/files/download/public/:folder/:file_name
// :folder = Folder ID - :file_name = File_Name.ext
fileController.downloadPublicFile = (req, res) => {
  try {
    const folder = req.params.folder; // Folder ID || 'home' (Root)
    const file_name = req.params.file_name; // File Name + Extension

    // Validate info
    if (!folder || !file_name) return res.status(404).send({ message: 'Archivo no encontrado' });

    // Check for Root folder
    if (folder == 'Inicio_public') {
      return res.sendFile(`${FILES_PATH}/public/${file_name}`);
    } else {
      return res.sendFile(`${FILES_PATH}/public/${folder}/${file_name}`);
    }

  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: 'Error al descargar el archivo (Catch)' });
  }
}

// GET - api/files/preview/public/:folder/:file_name
// :folder = Folder ID - :file_name = File_Name.ext
fileController.getPublicFilePreview = (req, res) => {
  try {
    const folder = req.params.folder; // Folder ID || 'home' (Root)
    const file_name = req.params.file_name; // File Name + Extension

    // Validate info
    if (!folder || !file_name) return res.status(404).send({ message: 'Archivo no encontrado' });
    // Check for Root folder
    if (folder == 'Inicio_public') {
      return res.sendFile(`${FILES_PATH}/public/${file_name}`);
    } else {
      return res.sendFile(`${FILES_PATH}/public/${folder}/${file_name}`);
    }

  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: 'Error al obtener archivo (Catch)' });
  }
}



/*
// ANGULAR!!
downloadFile(): void {
    const userId = 'ID_DEL_USUARIO'; // Debes reemplazar 'ID_DEL_USUARIO' por el ID del usuario
    const fileName = 'NOMBRE_DEL_ARCHIVO'; // Debes reemplazar 'NOMBRE_DEL_ARCHIVO' por el nombre del archivo
    this.fileService.getFile(userId, fileName).subscribe((data: Blob) => {
      const blob = new Blob([data], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }
*/
module.exports = fileController;