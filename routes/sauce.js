const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth")

const sauceCtrl = require("../controllers/sauce");
const multer = require('multer');

router.get('/', auth, sauceCtrl.getAllSauces);
router.get('/:id', auth, sauceCtrl.getOneSauce);
router.post('/', auth, multer, sauceCtrl.createSauce);
router.put("/:id", auth, multer, sauceCtrl.updateSauce)
router.delete("/:id", auth, sauceCtrl.deleteSauce)
router.post("/:id/like", auth, sauceCtrl.likeSauce)

module.exports = router;