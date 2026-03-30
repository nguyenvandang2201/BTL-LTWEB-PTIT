/**
 * @file roleMiddleware.js
 * @description Middleware phân quyền (Authorization) dựa trên vai trò người dùng.
 *
 * Các middleware trong file này phải được đặt SAU verifyToken trong chuỗi middleware,
 * vì chúng cần req.user (được gán bởi verifyToken) để kiểm tra role.
 *
 * Thứ tự sử dụng trong pipeline:
 *   route → verifyToken → isAdmin | isStudent → controller
 *
 * Vai trò hiện tại trong hệ thống:
 *  - 'admin'   : Quản trị viên, có toàn quyền quản lý nội dung và người dùng.
 *  - 'student' : Học viên, chỉ được truy cập các tính năng học tập cá nhân.
 */

/**
 * @function isAdmin
 * @description Middleware kiểm tra người dùng hiện tại có vai trò 'admin' không.
 *
 * Điều kiện cho phép tiếp tục:
 *  - req.user tồn tại (đã xác thực JWT thành công qua verifyToken).
 *  - req.user.role === 'admin'.
 *
 * Luồng xử lý:
 *  1. Kiểm tra req.user có tồn tại và role có phải 'admin' không.
 *  2. Nếu không đủ điều kiện → trả 403 (Forbidden) với thông báo từ chối.
 *  3. Nếu đủ điều kiện → gọi next() để chuyển sang controller.
 *
 * @param {import('express').Request}      req  - Request; req.user phải được gán trước bởi verifyToken.
 * @param {import('express').Response}     res  - Response JSON { message }.
 * @param {import('express').NextFunction} next - Hàm chuyển sang middleware/controller tiếp theo.
 *
 * @returns {void} Gọi next() nếu là admin; trả 403 nếu không phải.
 *
 * @returns {403} Người dùng không có quyền admin.
 */
export const isAdmin = (req, res, next) => {
  // Kiểm tra req.user tồn tại (phòng trường hợp middleware này được dùng sai thứ tự)
  // và xác nhận role phải là 'admin'.
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Truy cập bị từ chối. Chỉ Quản trị viên mới có quyền thực hiện hành động này',
    });
  }
  // Role hợp lệ, chuyển sang controller tiếp theo trong chuỗi.
  next();
};

/**
 * @function isStudent
 * @description Middleware kiểm tra người dùng hiện tại có vai trò 'student' không.
 *
 * Điều kiện cho phép tiếp tục:
 *  - req.user tồn tại (đã xác thực JWT thành công qua verifyToken).
 *  - req.user.role === 'student'.
 *
 * Luồng xử lý:
 *  1. Kiểm tra req.user có tồn tại và role có phải 'student' không.
 *  2. Nếu không đủ điều kiện → trả 403 (Forbidden) với thông báo từ chối.
 *  3. Nếu đủ điều kiện → gọi next() để chuyển sang controller.
 *
 * Lưu ý: Admin truy cập route yêu cầu isStudent cũng sẽ bị từ chối,
 * vì role của họ là 'admin', không phải 'student'.
 *
 * @param {import('express').Request}      req  - Request; req.user phải được gán trước bởi verifyToken.
 * @param {import('express').Response}     res  - Response JSON { message }.
 * @param {import('express').NextFunction} next - Hàm chuyển sang middleware/controller tiếp theo.
 *
 * @returns {void} Gọi next() nếu là student; trả 403 nếu không phải.
 *
 * @returns {403} Người dùng không có quyền student.
 */
export const isStudent = (req, res, next) => {
  // Kiểm tra req.user tồn tại và xác nhận role phải là 'student'.
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({
      message: 'Truy cập bị từ chối. Hành động này dành cho Học viên',
    });
  }
  // Role hợp lệ, chuyển sang controller tiếp theo trong chuỗi.
  next();
};
