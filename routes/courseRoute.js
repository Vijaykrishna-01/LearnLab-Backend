const express = require('express')
const { getAllCourse, getCourseById, addNewCourse, updateCourse, deleteCourse} = require('../controllers/courseController')
const { upload } = require('../middleware/fileUpload')
const { authUser } = require('../middleware/userAuth')


const router = express.Router()

router.get('/', getAllCourse)

router.get('/:courseId', getCourseById)

// router.get('/user/:userId' , getCoursesByUserId)

router.post("/", upload.array("images" ,4), addNewCourse);

router.patch('/:courseId', upload.array("images",4), updateCourse)

router.delete('/:courseId', deleteCourse)

module.exports = router;