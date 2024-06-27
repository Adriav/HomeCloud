const { Router } = require('express');
const userController = require('../controllers/user.controller');
const router = Router();

router.get('/get-pfp', userController.getProfilePicture);
router.get('/get-user/:id', userController.getUser);
router.get('/get-name/:id', userController.getUserName);
router.get('/validate/:id', userController.validateUser);
router.post('/register', userController.createUser);
router.post('/login', userController.login);
router.put('/update/name', userController.updateName);
router.put('/update/last-name', userController.updateLastName);
router.put('/update/email', userController.updateEmail);
router.put('/update/password', userController.updatePassword);


module.exports = router;