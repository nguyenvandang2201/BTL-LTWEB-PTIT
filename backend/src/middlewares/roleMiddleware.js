export const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Truy cập bị từ chối. Chỉ Quản trị viên mới có quyền thực hiện hành động này',
    });
  }
  next();
};

export const isStudent = (req, res, next) => {
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({
      message: 'Truy cập bị từ chối. Hành động này dành cho Học viên',
    });
  }
  next();
};
