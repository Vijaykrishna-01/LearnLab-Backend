const sanitizeUser = (user) => {
  const sanitized = user.toObject();
  delete sanitized.password;
  delete sanitized.refreshToken;
  delete sanitized.__v;
  return sanitized;
};

const sanitizeCourse = (course) => {
  const sanitized = course.toObject();
  delete sanitized.__v;
  return sanitized;
};

module.exports = { sanitizeUser, sanitizeCourse };