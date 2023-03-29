//import express + installation router + url vers les routes dans fichiers controllers
const express = require('express');
const router = express.Router();
const sauceCtrl = require('../controllers/sauce');

const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config');

//creation de nos routes et lien avec le controller correspondant + ajout de "auth" et de "multer" 
router.post('/', auth, multer, sauceCtrl.createSauce);
router.get('/', sauceCtrl.getAllSauces);
router.put('/:id', auth, multer, sauceCtrl.updateSauce);
router.delete('/:id', auth, sauceCtrl.deleteSauce);
router.post('/:id/like', auth, sauceCtrl.likeSauce);
router.get('/:id', auth, sauceCtrl.getOneSauce);

//Export du router
module.exports = router;
