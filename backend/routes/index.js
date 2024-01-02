// routes/index.js
const express = require('express');
const router = express.Router();
const homeController = require('../controllers/home');
const searchController = require('../controllers/search');  
const dashboard = require('../controllers/dashboard');

router.get('/', homeController.getHomePage);
router.get('/search', searchController.search); 
router.get('/autocomplete', searchController.autocomplete);
router.get('/getContent',searchController.fullContent);
router.get('/dashboard',dashboard.getDashboard);
router.post('/process-coordinates', dashboard.getCoordinates)


module.exports = router;
