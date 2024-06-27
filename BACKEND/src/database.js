const mongoose = require('mongoose');

mongoose.connect(process.env.DATA_BASE)
    .then(db => console.log('Database connected'))
    .catch(err => console.log(err));