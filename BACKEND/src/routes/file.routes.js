const { Router } = require('express');
const fileController = require('../controllers/file.controller');
const router = Router();

// ROUTE: /api/files
// - - - - - [ PRIVATE ] - - - - -
router.get('/get-pfp/:userID/:fileName', fileController.getProfilePicture);
router.post('/upload/:id', fileController.uploadFile);
router.post('/upload-user/:id/:name', fileController.uploadUserFiles);
router.put('/upload/pfp/:id', fileController.updateProfilePicture);
router.get('/get-user/:id', fileController.getUserFiles);
router.put('/update/name/user/:id', fileController.updateUserFile);
router.get('/download/user/:folder/:file_name', fileController.downloadUserFile);
router.delete('/delete/user/:folder/:id', fileController.deleteUserFile);
router.get('/preview/user/:owner/:folder/:file_name', fileController.getUserFilePreview);

// - - - - - [ PUBLIC ] - - - - -
router.post('/upload-public/:id/:name', fileController.uploadPublicFiles);
router.get('/get-public/:id', fileController.getPublicFiles);
router.put('/update/name/public/:id', fileController.updatePublicFile);
router.delete('/delete/public/:folder/:id', fileController.deletePublicFile);
router.get('/download/public/:folder/:file_name', fileController.downloadPublicFile);
router.get('/preview/public/:folder/:file_name', fileController.getPublicFilePreview);

module.exports = router;