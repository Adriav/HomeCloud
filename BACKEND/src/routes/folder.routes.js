const { Router } = require('express');
const folderController = require('../controllers/folder.controller');
const router = Router();

// ROUTE: /api/folders

// - - - - - [ PRIVATE ] - - - - -
router.post('/create/private', folderController.createUserFolder);
router.get('/private/:parent', folderController.getUserFolders);
router.get('/user/name/current/:id', folderController.getFolderName);
router.delete('/delete/user/:id', folderController.deleteUserFolder);
router.put('/update/name/user/:id', folderController.updateUserFolderName);
router.get('/favorite/user', folderController.getUserFavorites);
router.post('/favorite/:id', folderController.addToUserFavorites);
router.delete('/favorite/delete/:id', folderController.removeFromUserFavorites);

// - - - - - [ PUBLIC ] - - - - -
router.post('/create/public', folderController.createPublicFolder);
router.get('/public/:parent', folderController.getPublicFolders);
router.delete('/delete/public/:id', folderController.deletePublicFolder);
router.put('/update/name/public/:id', folderController.updatePublicFolderName);

module.exports = router;