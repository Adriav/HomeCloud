const tokenManager = require('../token');
const Folder = require('../models/folder.model');
const Favorite = require('../models/favorite.model');
const File = require('../models/file.model');
const fs = require('fs');
const path = require('path');

folderController = {}


// POST - api/folders/create/private
// id = Folder ID from BODY | userID = Header
folderController.createUserFolder = async (req, res) => {
  try {
    // Get the owner's encrypted ID from the Header
    const owner = tokenManager.getFromHeader(req.headers['authorization']);
    // Check if the user ID is correct
    if (!owner) return res.status(500).send({ message: 'Error en el usuario! (Owner)' });

    // Get the parent folder from the URL
    const parent = req.body.parent;
    // Check if there's a parent folder
    if (!parent) return res.status(500).send({ message: 'Error al crear folder (Parent)' });
    delete req.body._id;
    const newFolder = new Folder(req.body);

    newFolder.owner = owner;

    const folderPath = path.join(__dirname, '../assets/', owner, `${newFolder.name}_${newFolder._id.toString()}`);

    // Check if the folder already exists and creates it
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);

      // Should never reach this...
    } else {
      console.log(`Por algún motivo, la carpeta ya existe... \n${userFolderPath}\n${userPicturePath}`);
      return res.status(500).send({ message: 'Error al crear la carpeta (FS)' });
    }

    // Saves the folder on the DB
    await newFolder.save();

    // Successful folder creation
    return res.status(201).send({ message: 'Carpeta creada con éxito!' });

  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: 'Error al crear la carpeta (Catch)' })
  }
}


// GET - api/folders/private/:parent
// id = Folder ID | userID = Header
folderController.getUserFolders = async (req, res) => {
  try {
    // Gets the parent ID
    const parent = req.params.parent;
    // Gets the owner ID
    const owner = tokenManager.getFromHeader(req.headers['authorization']);
    // Check for valid Parent and Owner
    if (!parent || !owner) return res.status(500).send({ message: 'Error en credenciales' });
    // Get the folder list from DB
    await Folder.find({ owner: owner, parent: parent }).sort({ name: 1 })
      .then(folders => { return res.status(200).send(folders) })
      .catch((err) => {
        console.log(err);
        return res.status(500).send({ message: 'Error al obtener carpetas (DB)' });
      })

  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: 'Error al obtener las carpetas (Catch)' });
  }
}


// GET - api/folders/user/name/current/:id
// id = Folder ID | userID = Header
folderController.getFolderName = async (req, res) => {
  try {
    // Gets the Current Folder ID
    const current = req.params.id;

    // Check for valid Parent Folder
    if (!current) return res.status(500).send({ message: 'Error en datos de folder' });

    await Folder.findById(current)
      .then((folder) => {
        return res.status(200).json({ name: folder.name, parent: folder.parent });
      })
      .catch((err) => {
        console.log(err);
        return res.status(500).send({ message: 'Error al obtener nombre de la carpeta (DB)' })
      })
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: 'Error al obtener nombre de la carpeta' });
  }
}



// - - - - - - - - - - [ DELETE USER FOLDER ] - - - - - - - - - -

// DELETE - api/folders/delete/user/:id
// id = Folder ID
folderController.deleteUserFolder = async (req, res) => {
  try {
    // Gets the folder ID from the URL
    let root_folder = req.params.id;

    // Calls the function to delete the folder
    await recursiveUserFolderDelete(root_folder);
    return res.json({ message: "Carpeta eliminada con Éxito!" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "ta malo" });
  }
}

async function recursiveUserFolderDelete(folderID) {
  // Get the children for the current folder
  let children = await Folder.find({ parent: folderID });

  // While the folder has children, enter each child to delete the folder
  while (children.length > 0) {
    children.forEach(child => {
      recursiveUserFolderDelete(child._id);
    });
    // Updates the list of the Folder's children
    children = await Folder.find({ parent: folderID });
  }

  // The folder has no child left, Deleting the current (root) folder
  // Delete the Folder from the DB
  await Folder.findByIdAndDelete(folderID).then((folder) => {
    if (folder) {
      // Delete the Folder from the File System
      recursiveUserFolderDeleteAux(folder);
      // If saved as "Favorite", removes it from DB
      Favorite.findOneAndDelete({ folder: folderID }).then((fav) => {
        if (fav) console.log(`Eliminado: ${fav}`);
      });
    }
    // Error handler
  }).catch((error) => {
    console.log(error);
    return res.status(500).send({ message: 'Algo salio mal en DB' });
  });
}

// Removes it from the File System
async function recursiveUserFolderDeleteAux(folder) {
  // Gets the path of the folder on the File System
  const folder_path = path.join(__dirname, '../assets/', folder.owner, `${folder.name}_${folder._id.toString()}`);

  // Deletes the files and then deletes the folder
  await File.deleteMany({ folder: folder._id }).then(_ => {
    // Deletes it from the File System
    fs.rm(folder_path, { recursive: true, force: true }, (err) => {
      if (err) { // Error Handler
        console.log('Error en FS\n', err);
        return;
      }
    });
  });
}



// PUT - api/folders/update/user/name/:id
// :id = Folder ID
folderController.updateUserFolderName = async (req, res) => {
  try {
    const folderID = req.params.id; // Folder ID from the URL
    const newFolderName = req.body.newName; // New folder Name from the body
    const oldFolderName = req.body.oldName; // Previous folder Name from the body

    // Check if the new name is the same as the previous name
    if (newFolderName == oldFolderName) return res.status(200).send({ message: 'No hubo cambio en el nombre!' });

    const owner = req.body.owner; // Gets the User ID as the owner from the body
    // Creates the path for the previous folder name
    const old_folder_path = path.join(__dirname, '../assets/', owner, `${oldFolderName}_${folderID}`);
    // Creates the path for the previous folder name
    const new_folder_path = path.join(__dirname, '../assets/', owner, `${newFolderName}_${folderID}`);

    // Updates the folder on the DB
    await Folder.findByIdAndUpdate(folderID, { name: newFolderName }).then((folder) => {
      // Error if there's no folder
      if (!folder) return res.status(500).send({ message: 'Error al actualizar el nombre (DB)' });
      Favorite.updateOne({ folder: folderID }, { folder_name: newFolderName })
        .then(_ => {
          console.log('');
        });

      // Renames the folder on the file system
      fs.renameSync(old_folder_path, new_folder_path);
      // Returns success
      return res.status(200).send({ message: 'Nombre actualizado con éxito!' });

      // Error Handler
    }).catch((err) => {
      console.log(err);
      return res.status(500).send({ message: 'Error al actualizar el nombre (cDB)' });
    });

    // Error Handler
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: 'Error al actualizar el nombre (Catch)' });
  }
}


// POST - api/folders/favorite/:id
// :id = Folder ID
// userID = Token (Header)
folderController.addToUserFavorites = async (req, res) => {
  try {
    // Gets the Folder ID from the URL
    const folderID = req.params.id;
    // Gets the User ID from the header
    const userID = tokenManager.getFromHeader(req.headers['authorization']);
    // Checks the User ID
    if (!userID || !folderID) return res.status(500).send({ message: 'Error al obtener el ID' });

    // Get if the folder is public
    const public = req.body.isPublic;

    await Folder.findById(folderID).then((folder) => {
      // Check for the existing folder
      if (!folder) return res.status(500).send({ message: 'Error al guardar en favoritos (Server)' });
      // Creates a new Favorite entry
      const newFavorite = new Favorite({
        user: userID,
        folder: folderID,
        folder_name: folder.name,
        public: public
      });

      // Saves it on the DB
      newFavorite.save()
        .then(_ => { return res.status(200).send({ message: 'Carpeta guardada en favoritos' }) })
        // Error Handler
        .catch((err) => {
          console.log(err);
          return res.status(500).send({ message: 'Error al guardar en favoritos (cDB)' });
        });
    })

    // Error Handler
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: 'Error al guardar en favoritos (Catch)' });
  }
}


// GET - api/folders/favorite/user
// userID = Token (Header)
folderController.getUserFavorites = async (req, res) => {
  try {
    // Gets the User ID from the Header
    const userID = tokenManager.getFromHeader(req.headers['authorization']);
    // Checks the User ID
    if (!userID) return res.status(500).send({ message: 'Error al obtener el ID' });

    // Return the User's Favorite Folders
    await Favorite.find({ user: userID }).sort({ folder_name: 1 })
      .then((favorites) => { return res.status(200).json(favorites) })
      .catch((err) => { console.log(err); return res.status(500).send({ message: 'Error al los favoritos (cDB)' }); });

  } catch (error) {
    console.log(err);
    return res.status(500).send({ message: 'Error al los favoritos (Catch)' });
  }
}

// DELETE - api/folders/favorite/delete/:id
// :id = Folder ID
// User ID = Token (Header)
folderController.removeFromUserFavorites = async (req, res) => {
  try {
    // Gets the Folder ID from the URL
    const folderID = req.params.id;
    // Gets the User ID from the Header
    const userID = tokenManager.getFromHeader(req.headers['authorization']);
    // Checks the User ID
    if (!userID || !folderID) return res.status(500).send({ message: 'Error al obtener el ID' });

    await Favorite.findOneAndDelete({ user: userID, folder: folderID })
      .then(_ => { return res.sendStatus(204); })
      .catch((err) => { // Error Handler
        console.log(err);
        return res.status(500).send({ message: 'Error al eliminar de favoritos (DB)' });
      })
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: 'Error al eliminar de favoritos (Catch)' });
  }
}



// - - - - - - - - - - [ PUBLIC FOLDERS ] - - - - - - - - - -

// POST - api/folders/create/public
// id = Folder ID from BODY | userID = Header
folderController.createPublicFolder = async (req, res) => {
  try {
    // Get the owner's encrypted ID from the Header
    const owner = tokenManager.getFromHeader(req.headers['authorization']);
    // Check if the user ID is correct
    if (!owner) return res.status(500).send({ message: 'Error en el usuario! (Owner)' });

    // Get the parent folder from the URL
    const parent = req.body.parent;
    // Check if there's a parent folder
    if (!parent) return res.status(500).send({ message: 'Error al crear folder (Parent)' });
    delete req.body._id;
    const newFolder = new Folder(req.body);

    newFolder.owner = owner;

    const folderPath = path.join(__dirname, '../assets/public', `${newFolder.name}_${newFolder._id.toString()}`);

    // Check if the folder already exists and creates it
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);

      // Should never reach this...
    } else {
      console.log(`Por algún motivo, la carpeta ya existe... \n${userFolderPath}\n${userPicturePath}`);
      return res.status(500).send({ message: 'Error al crear la carpeta (FS)' });
    }

    // Saves the folder on the DB
    await newFolder.save();

    // Successful folder creation
    return res.status(201).send({ message: 'Carpeta creada con éxito!' });


  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: 'Error crear carpeta (Catch)' });
  }
}


// GET - api/folders/public/:parent
// parent = Folder ID
folderController.getPublicFolders = async (req, res) => {
  try {
    // Gets the parent ID
    const parent = req.params.parent;
    // Check for valid Parent and Owner
    if (!parent) return res.status(500).send({ message: 'Error en los datos' });

    // Get the folder list from DB
    await Folder.find({ parent: parent, public: true }).sort({ name: 1 })
      .then(folders => { return res.status(200).send(folders) })
      .catch((err) => {
        console.log(err);
        return res.status(500).send({ message: 'Error al obtener carpetas (DB)' });
      })

    // Error Handler
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: 'Error al obtener las carpetas (Catch)' });
  }
}


// - - - - - [ DELETE PUBLIC FOLDER ] - - - - -

// DELETE - api/folders/delete/public/:id
// id = Folder ID
folderController.deletePublicFolder = async (req, res) => {
  try {
    // Gets the folder ID from the URL
    let root_folder = req.params.id;

    // Calls the function to delete the folder
    await recursivePublicFolderDelete(root_folder);

    return res.json({ message: "Carpeta eliminada con Éxito!" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "Error al eliminar la carpeta" });
  }
}

async function recursivePublicFolderDelete(folderID) {
  // Get the children for the current folder
  let children = await Folder.find({ parent: folderID });

  // While the folder has children, enter each child to delete the folder
  while (children.length > 0) {
    children.forEach(child => {
      recursivePublicFolderDelete(child._id);
    });
    // Updates the list of the Folder's children
    children = await Folder.find({ parent: folderID });
  }

  // The folder has no child left, Deleting the current (root) folder
  // Delete the Folder from the DB
  await Folder.findByIdAndDelete(folderID).then((folder) => {
    if (folder) {
      // Delete the Folder from the File System
      recursivePublicFolderDeleteAux(folder);
      // If saved as "Favorite", removes it from DB
      Favorite.findOneAndDelete({ folder: folderID }).then((fav) => {
        if (fav) console.log(`Eliminado: ${fav}`);
      });
    }
    // Error handler
  }).catch((error) => {
    console.log(error);
    return res.status(500).send({ message: 'Algo salio mal en DB' });
  });
}

// Removes it from the File System
async function recursivePublicFolderDeleteAux(folder) {
  // Gets the path of the folder on the File System
  const folder_path = path.join(__dirname, '../assets/public/', `${folder.name}_${folder._id.toString()}`);

  // Deletes the files and then deletes the folder
  await File.deleteMany({ folder: folder._id }).then(_ => {
    // Deletes it from the File System
    fs.rm(folder_path, { recursive: true, force: true }, (err) => {
      if (err) { // Error Handler
        console.log('Error en FS\n', err);
        return;
      }
    });
  });

}

// - - - - - [ END DELETE PUBLIC FOLDER ] - - - - -

// PUT - api/folders/update/public/name/:id
// :id = Folder ID
folderController.updatePublicFolderName = async (req, res) => {
  try {
    const folderID = req.params.id; // Folder ID from the URL
    const newFolderName = req.body.newName; // New folder Name from the body
    const oldFolderName = req.body.oldName; // Previous folder Name from the body

    // Check if the new name is the same as the previous name
    if (newFolderName == oldFolderName) return res.status(200).send({ message: 'No hubo cambio en el nombre!' });

    // Creates the path for the previous folder name
    const old_folder_path = path.join(__dirname, '../assets/public/', `${oldFolderName}_${folderID}`);
    // Creates the path for the previous folder name
    const new_folder_path = path.join(__dirname, '../assets/public/', `${newFolderName}_${folderID}`);

    // Updates the folder on the DB
    await Folder.findByIdAndUpdate(folderID, { name: newFolderName }).then((folder) => {
      // Error if there's no folder
      if (!folder) return res.status(500).send({ message: 'Error al actualizar el nombre (DB)' });
      Favorite.updateOne({ folder: folderID }, { folder_name: newFolderName })
        .then(_ => {
          console.log('');
        });

      // Renames the folder on the file system
      fs.renameSync(old_folder_path, new_folder_path);
      // Returns success
      return res.status(200).send({ message: 'Nombre actualizado con éxito!' });

      // Error Handler
    }).catch((err) => {
      console.log(err);
      return res.status(500).send({ message: 'Error al actualizar el nombre (cDB)' });
    });

    // Error Handler
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: 'Error al actualizar el nombre (Catch)' });
  }
}






module.exports = folderController;