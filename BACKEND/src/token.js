const tokenManager = {}
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const HASH_SALT = 12

// Get the user ID from the header 'Authorization'
tokenManager.getFromHeader = (header) => {
  try {
    // Check if the header is valid
    if (!header || !header.startsWith('Bearer')) {
      return null;
    }

    // Get the encrypted ID
    const token = header.split(' ')[1];

    // Check if there's a token
    if (!token) return null;

    // Decrypt the Token to get the User ID
    const userID = jwt.verify(token, process.env.SECRET_KEY)._id;

    // Check if there's an ID
    if (!userID) return null;

    // Returns the User ID
    return userID;

    // Error Handler
  } catch (error) {
    console.log(error);
    return null;
  }
}


tokenManager.getFromURL = (params) => {
  try {
    if (!params.id) return null;

    const userID = jwt.verify(params.id, process.env.SECRET_KEY)._id;
    return userID
  } catch (error) {
    console.log(error);
    return null;
  }
}



tokenManager.signToken = (data) => {
  try {
    if (!data) return null;

    const token = jwt.sign({ _id: data }, process.env.SECRET_KEY);
    return token;
  } catch (error) {
    console.log(error);
    return null;
  }
}

tokenManager.encryptData = async (data) => {
  try {
    if (!data) return null;
    const hashed = await bcrypt.hash(data, HASH_SALT);
    return hashed;

  } catch (error) {
    console.log(error);
    return null;
  }
}

tokenManager.compareData = (data, hashed) => {
  return bcrypt.compareSync(data, hashed)
}

module.exports = tokenManager;