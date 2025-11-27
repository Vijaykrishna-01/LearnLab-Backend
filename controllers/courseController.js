
// const { cloudinary } = require("../config/cloudinaryConfig");
// const fs = require("fs");
const path = require("path");
const { uploadCloudinary, deleteFromCloudinary } = require("../utils/uploadCloudinary");
const Course = require("../models/courseModel");
// const { User } = require("../models/userModel");

const addNewCourse = async (req, res) => {
  try {
      const {
          title,
          description,
          category,
          price,
          modules,
          instructor,
          promoVideo,
          level,
          language,
          requirements,
          whatYouWillLearn,
          tags
      } = req.body;

      // Parse modules data if it's sent as a string
      const parsedModules = typeof modules === 'string' ? JSON.parse(modules) : modules;

      // Validate required fields
      if (!title || !description || !category || !price || !parsedModules || !instructor) {
          return res.status(400).json({
              success: false,
              message: "All required fields must be provided"
          });
      }

      // Handle image uploads
      let uploadedImages = [];
      if (req.files && req.files.length > 0) {
          // Upload each image to Cloudinary
          const uploadPromises = req.files.map(async (file, index) => {
              const publicId = `courses/${Date.now()}-${index}`;
              const result = await uploadCloudinary(file.path, publicId);
              
              return {
                  publicId: result.public_id,
                  url: result.secure_url
              };
          });

          uploadedImages = await Promise.all(uploadPromises);
      }

      // Use the first image as course main image
      const courseImage = uploadedImages[0] || null;

      // Process modules and map remaining images to lessons
      let imageIndex = 1; // Start from second image, as first is used for course
      const processedModules = parsedModules.map(module => {
          const processedLessons = module.lessons.map(lesson => {
              // Assign an image to the lesson if available
              const lessonImage = imageIndex < uploadedImages.length 
                  ? uploadedImages[imageIndex++] 
                  : null;

              return {
                  title: lesson.title,
                  duration: lesson.duration,
                  image: lessonImage
              };
          });

          return {
              moduleNumber: module.moduleNumber,
              title: module.title,
              lessons: processedLessons
          };
      });

      // Calculate total duration of the course (in minutes)
      const totalDuration = parsedModules.reduce((total, module) => {
          return total + module.lessons.reduce((sum, lesson) => sum + parseInt(lesson.duration), 0);
      }, 0);

      // Create new course
      const newCourse = new Course({
          title,
          description,
          category,
          price: Number(price),
          instructor, // Assuming you have user info from auth middleware
          image: courseImage,
          promoVideo,
          level,
          language,
          requirements,
          whatYouWillLearn,
          tags,
          modules: processedModules,
          totalDuration
      });

      // Save the course
      await newCourse.save();

      // Send response
      return res.status(201).json({
          success: true,
          message: "Course created successfully",
          course: newCourse
      });

  } catch (error) {
      // Clean up any uploaded files if there's an error
      console.error("Error in addNewCourse:", error);
      return res.status(500).json({
          success: false,
          message: "Failed to create course",
          error: error.message
      });
  }
};


const getAllCourse = async (req, res) => {
  try {
    const courses = await Course.find(req.query)
      .populate('categoryDetails', 'name')
      .populate('instructorDetails', 'name email profileImage')
      .populate('studentDetails', 'name email profileImage')
      .select('title description price image.url averageRating status isFree level language')
      .exec();

    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: "Error fetching courses", error: error.message });
  }
};


// Get a single course by ID
const getCourseById = async (req, res) => {
  try {
    const { ids } = req.body; // Array of course IDs

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No course IDs provided' });
    }

    const courses = await Course.find({ '_id': { $in: ids } })
      .populate('categoryDetails', 'name')
      .populate('instructorDetails', 'name email')
      .populate('studentDetails', 'name email')
      .exec();

    if (courses.length === 0) {
      return res.status(404).json({ message: 'No courses found for the provided IDs' });
    }

    res.status(200).json(courses);
  } catch (error) {
    console.error("Error fetching courses by IDs:", error);
    res.status(500).json({ message: 'Error fetching courses', error: error.message });
  }
};


//Get CourseBy UserId
const updateCourse = async (req, res) => {
  try {
      const courseId = req.params.courseId;
      const {
          title,
          description,
          category,
          price,
          modules,
          instructor,
          students,
          promoVideo,
          level,
          language,
          requirements,
          whatYouWillLearn,
          tags,
          status
      } = req.body;

      // Find existing course
      const existingCourse = await Course.findById(courseId);
      if (!existingCourse) {
          return res.status(404).json({
              success: false,
              message: "Course not found"
          });
      }

      // Parse modules data if it's sent as a string
      const parsedModules = typeof modules === 'string' ? JSON.parse(modules) : modules;

      // Handle image uploads (same logic as in addNewCourse)
      let uploadedImages = [];
      if (req.files && req.files.length > 0) {
          if (existingCourse.image) {
              await deleteFromCloudinary(existingCourse.image.publicId);
          }
          existingCourse.modules.forEach(module => {
              module.lessons.forEach(lesson => {
                  if (lesson.image) {
                      deleteFromCloudinary(lesson.image.publicId);
                  }
              });
          });

          const uploadPromises = req.files.map(async (file, index) => {
              const publicId = `courses/${Date.now()}-${index}`;
              const result = await uploadCloudinary(file.path, publicId);
              return {
                  publicId: result.public_id,
                  url: result.secure_url
              };
          });

          uploadedImages = await Promise.all(uploadPromises);
      }

      const courseImage = uploadedImages[0] || existingCourse.image;

      // Process modules and lessons as before
      let imageIndex = 1;
      const processedModules = parsedModules.map(module => {
          const processedLessons = module.lessons.map(lesson => {
              const existingLesson = existingCourse.modules
                  .find(m => m.moduleNumber === module.moduleNumber)
                  ?.lessons.find(l => l.title === lesson.title);

              const lessonImage = imageIndex < uploadedImages.length 
                  ? uploadedImages[imageIndex++] 
                  : (existingLesson?.image || null);

              return {
                  title: lesson.title,
                  duration: lesson.duration,
                  image: lessonImage
              };
          });

          return {
              moduleNumber: module.moduleNumber,
              title: module.title,
              lessons: processedLessons
          };
      });

      // Recalculate total duration
      const totalDuration = parsedModules.reduce((total, module) => {
          return total + module.lessons.reduce((sum, lesson) => sum + parseInt(lesson.duration), 0);
      }, 0);

      const updatedCourse = await Course.findByIdAndUpdate(
          courseId,
          {
              title,
              description,
              category,
              price: Number(price),
              instructor,
              promoVideo,
              level,
              language,
              requirements,
              whatYouWillLearn,
              tags,
              modules: processedModules,
              status: status || existingCourse.status,
              totalDuration
          },
          { new: true }
      );

      return res.status(200).json({
          success: true,
          message: "Course updated successfully",
          course: updatedCourse
      });

  } catch (error) {
      console.error("Error in updateCourse:", error);
      return res.status(500).json({
          success: false,
          message: "Failed to update course",
          error: error.message
      });
  }
};

// Delete a course by ID
const deleteCourse = async (req, res) => {
  try {
    const deletedCourse = await Course.findByIdAndDelete(req.params.courseId).exec();

    if (!deletedCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (deletedCourse.image && deletedCourse.image.publicId) {
      try {
        await deleteFromCloudinary(deletedCourse.image.publicId);
      } catch (error) {
        console.error(`Error deleting image ${deletedCourse.image.publicId} from Cloudinary:`, error);
      }
    }

    res.status(200).json({ message: "Course deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting course", error: error.message });
  }
};



module.exports = {
  getAllCourse,
  getCourseById,
  addNewCourse,
  updateCourse,
  deleteCourse,
};
