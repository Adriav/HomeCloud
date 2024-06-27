const userController = {}
const User = require('../models/user.model');
const fs = require('fs');
const path = require('path');
const tokenManager = require('../token');

// GET - api/users/get-user/:id
// :id = UserID (Token)
userController.getUser = async (req, res) => {
  try {
    // const userID = jwt.verify(req.params.id, process.env.SECRET_KEY)._id;
    const userID = tokenManager.getFromURL(req.params);
    if (!userID) return res.status(500).send({ message: 'Error al obtener el ID' });

    await User.findById(userID)
      .then((user) => res.status(200).json(user))
      .catch((err) => { console.log(err); return res.status(401).json(err) });

  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "Algo salio mal\nPuede ser por el token o el usuario" });
  }
}

// GET - api/users/get-name/:id
// :id = UserID
userController.getUserName = async (req, res) => {
  try {
    const userID = req.params.id;
    await User.findById(userID).then((user) => {
      if (!user) return res.status(500).send({ message: 'Usuario no encontrado (DB)' });
      return res.status(200).json({ name: user.name });
    }).catch((err) => {
      return res.status(500).send({ message: 'Error al obtener nombre de usuario (cDB)' });
    })
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: 'Error al obtener nombre de usuario (Catch)' });
  }
}


// POST - api/users/register
userController.createUser = async (req, res) => {
  try {
    // Creates a new user using the User model
    const newUser = new User(req.body);

    // See if the email is already registered, if true, doesn't save the user
    if (await User.find({ email: newUser.email }).countDocuments() > 0) {
      return res.status(500).send({ message: "Correo ya se encuentra registrado" });

    } else {
      // Encrypts the password
      // const pass = await bcrypt.hash(newUser.password, 12);
      const pass = await tokenManager.encryptData(newUser.password);
      if (!pass) return res.status(500).send({ message: 'Error al encriptar contraseña' });

      // Assign the encrypted password to the user
      newUser.password = pass;

      // Creates a folder with the user's ID
      const userFolderPath = path.join(__dirname, '../assets/', newUser._id.toString());
      const userPicturePath = path.join(__dirname, '../assets/pfp', newUser._id.toString());

      // Check if the folder already exists and creates it
      if (!fs.existsSync(userFolderPath) && !fs.existsSync(userPicturePath)) {
        fs.mkdirSync(userFolderPath);
        fs.mkdirSync(userPicturePath);

        // Should never reach this...
      } else {
        console.log(`Por algún motivo, la carpeta ya existe... \n${userFolderPath}\n${userPicturePath}`);
      }


      // Saves the user on the DB
      await newUser.save();

      // Gets the _id and stores it as a Token
      // const token = jwt.sign({ _id: newUser._id }, process.env.SECRET_KEY);
      const token = tokenManager.signToken(newUser._id);
      if (!token) return res.status(500).send({ message: 'Error al crear token' });

      // Returns the Token
      return res.status(201).json({ token });
    }

  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: "Error al crear el usuario..." });
  }
}

// POST - api/users/login
userController.login = async (req, res) => {
  try {
    // Gets the Email and Password form the request body
    const { email, password } = req.body;

    // Try to find the user with the Email
    User.findOne({ email: email })
      .then((user) => {
        // Check if the email is registered
        if (!user) return res.status(401).send({ message: "Usuario o contraseña incorrectos" });

        // First the password sent on the form - then, the users hashed password ont he DB
        // if (bcrypt.compareSync(password, user.password)) {
        if (tokenManager.compareData(password, user.password)) {
          // Sign the token with the user's ID
          // const token = jwt.sign({ _id: user._id }, process.env.SECRET_KEY);
          const token = tokenManager.signToken(user._id);
          // Send the Token
          return res.status(200).json({ token });

        } else {
          return res.status(401).send({ message: "Usuario o contraseña incorrectos" });
        }

        // DB ERROR
      }).catch((err) => { console.log(err); res.status(401).send({ message: "Usuario o contraseña incorrectos" }) });

  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
}

// GET - api/users/get-pfp
// Header = UserID (Token)
userController.getProfilePicture = async (req, res) => {
  try {
    // Get the authentication header
    const userID = tokenManager.getFromHeader(req.headers['authorization']);
    if (!userID) return res.status(401).send({ message: 'No autorizado' });

    // Gets the ID from the token
    // const userID = jwt.verify(token, process.env.SECRET_KEY)._id;

    // Gets the User with the ID
    await User.findById(userID).then((user) => {
      // Check if the user has a PFP
      const profile_picture = user.profile_picture;
      if (!profile_picture) {
        return res.status(200).json({ file_URL: null });

      } else {
        // Gets the path to the Profile Picture
        const file_URL = `http://192.168.0.75:4000/api/files/get-pfp/${userID}/${profile_picture}`
        return res.status(200).send({ file_URL });
      }

    }, (err) => {
      console.log(err);
      return res.status(404).send({ message: 'Foto de perfil no encontrada' });

    }).catch((err) => {
      console.log(err);
      return res.status(500).send({ message: 'Error en la BD al obtener Foto Perfil' });

    });

  } catch (err) {
    return res.status(500).send({ message: 'Error al cargar la foto de perfil' });
  }
}


// GET - api/users/validate/:id
// :id = UserID (TOKEN)
userController.validateUser = async (req, res) => {
  try {
    // Get the user ID from the params
    // const userID = jwt.verify(req.params.id, process.env.SECRET_KEY)._id;
    const userID = tokenManager.getFromURL(req.params);

    // Return if its a valid user
    await User.findById(userID).then(user => {
      if (user) {
        return res.status(200).send({ isValid: true });
      } else {
        return res.status(200).send({ isValid: false });
      }
    });

  } catch (error) {
    console.log(error);
    return res.status(200).send({ isValid: false });
  }
}


// PUT - api/users/update/name/
// Header = UserID (Token)
userController.updateName = async (req, res) => {
  try {
    // Get the authentication header
    // const token = req.headers['authorization'].split(' ')[1];
    const userID = tokenManager.getFromHeader(req.headers['authorization']);

    // Checks for the Authentication header
    if (!userID) return res.status(401).send({ message: 'No esta autorizado!' })

    // Gets the ID from the token
    // const userID = jwt.verify(token, process.env.SECRET_KEY)._id;

    // Gets the User with the ID and updates the Name
    await User.findByIdAndUpdate(userID, { name: req.body.newName }).then((user) => {
      if (!user) return res.status(404).send({ message: 'Usuario no encontrado (?)' });
      return res.status(200).send({ message: 'Nombre actualizado con éxito!' });

    }).catch((err) => {
      console.log(err);
      return res.status(500).send({ message: 'Error al actualizar usuario en DB' });
    });

  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: 'Error al actualizar usuario en Servidor' });
  }
}


// PUT - api/users/update/last-name/
// Header = UserID (Token)
userController.updateLastName = async (req, res) => {
  try {
    // Get the authentication header
    // const token = req.headers['authorization'].split(' ')[1];
    const userID = tokenManager.getFromHeader(req.headers['authorization']);

    // Checks for the Authentication header
    if (!userID) return res.status(401).send({ message: 'No esta autorizado!' });

    // Gets the ID from the token
    // const userID = jwt.verify(token, process.env.SECRET_KEY)._id;

    // Gets the User with the ID and updates the Last Name
    await User.findByIdAndUpdate(userID, { last_name: req.body.newLastName }).then((user) => {
      if (!user) return res.status(404).send({ message: 'Usuario no encontrado (?)' });
      return res.status(200).send({ message: 'Apellido(s) actualizado con éxito!' });

    }).catch((err) => {
      console.log(err);
      return res.status(500).send({ message: 'Error al actualizar usuario en DB' });
    });

  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: 'Error al actualizar usuario en Servidor' });
  }
}

// PUT - api/users/update/email/
// Header = UserID (Token)
userController.updateEmail = async (req, res) => {
  try {
    // Get the authentication header
    // const token = req.headers['authorization'].split(' ')[1];
    const userID = tokenManager.getFromHeader(req.headers['authorization']);

    // Checks for the Authentication header
    if (!userID) return res.status(401).send({ message: 'No esta autorizado!' });

    // Gets the ID from the token
    // const userID = jwt.verify(token, process.env.SECRET_KEY)._id;

    // Gets the User with the ID and updates the Email
    await User.findByIdAndUpdate(userID, { email: req.body.newEmail }).then((user) => {
      if (!user) return res.status(404).send({ message: 'Usuario no encontrado (?)' });
      return res.status(200).send({ message: 'Correo actualizado con éxito!' });

    }).catch((err) => {
      console.log(err);
      return res.status(500).send({ message: 'Correo ya registrado' });
    });

  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: 'Error al actualizar el correo en Servidor' });
  }
}


// PUT - api/users/update/password/
// Header = UserID (Token)
userController.updatePassword = async (req, res) => {
  try {
    // Get the authentication header
    // const token = req.headers['authorization'].split(' ')[1];
    const userID = tokenManager.getFromHeader(req.headers['authorization']);

    // Checks for the Authentication header
    if (!userID) return res.status(401).send({ message: 'No esta autorizado!' });

    // Gets the ID from the token
    // const userID = jwt.verify(token, process.env.SECRET_KEY)._id;

    // Encrypts the password
    // const pass = await bcrypt.hash(req.body.newPassword, 12);
    const pass = await tokenManager.encryptData(req.body.nwePassword);

    // Gets the User with the ID and updates the Email
    await User.findByIdAndUpdate(userID, { password: pass }).then((user) => {
      if (!user) return res.status(404).send({ message: 'Usuario no encontrado (?)' });
      return res.status(200).send({ message: 'Contraseña actualizada con éxito!' });

    }).catch((err) => {
      console.log(err);
      return res.status(500).send({ message: 'Error al actualizar contraseña en DB' });
    });


  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: 'Error al actualizar contraseña en Servidor' });
  }
}



module.exports = userController;