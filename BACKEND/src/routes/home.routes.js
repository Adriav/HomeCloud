const {Router} = require('express');
const router = Router();

router.get('/', (req, res) => {
    return res.send('Hola Home!');
});

module.exports = router;