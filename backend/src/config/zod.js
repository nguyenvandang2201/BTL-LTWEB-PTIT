/**
 * @file zod.js
 * @description Thiết lập ngôn ngữ mặc định cho thông báo lỗi của Zod.
 *
 * Mỗi schema trong `src/schemas/` đều tự khai báo thông báo tiếng Việt cho các
 * ràng buộc nghiệp vụ (độ dài tối thiểu, định dạng email, khoảng giá trị...).
 * Tuy nhiên những lỗi *mặc định* do Zod tự sinh — điển hình là trường bắt buộc
 * bị thiếu hoàn toàn — vẫn dùng tiếng Anh.
 *
 * Nạp locale `vi` của Zod giúp toàn bộ response lỗi validate thống nhất tiếng
 * Việt, thay vì lẫn lộn "Invalid input: expected string, received undefined"
 * giữa các thông báo đã được biên soạn.
 *
 * Module chỉ có tác dụng phụ (side effect), không export gì; chỉ cần import
 * một lần duy nhất ở `src/app.js` trước khi xử lý request.
 */

import { z } from 'zod';
import { vi } from 'zod/locales';

z.config(vi());
