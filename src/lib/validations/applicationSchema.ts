import { z } from 'zod';

export const draftSchema = z.object({
  fullName: z.string().min(1, 'Bắt buộc nhập họ tên'),
  dob: z.string().min(1, 'Bắt buộc nhập ngày sinh'),
  address: z.string().min(1, 'Bắt buộc nhập địa chỉ Zairyu (Kanji)'),
});

export const sent1stSchema = draftSchema.extend({
  zairyuFrontUrl: z.string().min(1, 'Bắt buộc có ảnh Zairyu mặt trước'),
  zairyuBackUrl: z.string().min(1, 'Bắt buộc có ảnh Zairyu mặt sau'),
  passportUrl: z.string().min(1, 'Bắt buộc có ảnh Hộ chiếu'),
  nenkinBookUrl: z.string().min(1, 'Bắt buộc có ảnh Sổ Nenkin'),
  applyDate: z.string().min(1, 'Bắt buộc nhập ngày nộp (applyDate)'),
  nenkinNumber: z.string().min(1, 'Bắt buộc nhập mã số Nenkin'),
});

export const received1stSchema = sent1stSchema.extend({
  noticeDate: z.string().min(1, 'Bắt buộc nhập ngày ra thông báo (noticeDate)'),
  noticeImageUrl: z.string().min(1, 'Bắt buộc có ảnh giấy báo Cục Thuế'),
  totalExpectedJpy: z.coerce.number().min(0, 'Bắt buộc nhập tổng tiền báo (totalExpectedJpy)'),
  received1stJpy: z.coerce.number().min(0, 'Bắt buộc nhập tiền thực nhận Lần 1'),
});

export const sent2ndSchema = received1stSchema.extend({
  taxRepresentativeId: z.string().min(1, 'Bắt buộc chọn người đại diện khai thuế'),
  sent2ndDate: z.string().min(1, 'Bắt buộc nhập ngày nộp Lần 2 (sent2ndDate)'),
});

export const received2ndSchema = sent2ndSchema.extend({
  received2ndDate: z.string().min(1, 'Bắt buộc nhập ngày nhận Lần 2 (received2ndDate)'),
  received2ndJpy: z.coerce.number().min(0, 'Bắt buộc nhập tiền nhận Lần 2 (received2ndJpy)'),
  tax2ndJpy: z.coerce.number().min(0, 'Bắt buộc nhập thuế Lần 2 (tax2ndJpy)'),
});

export const completedSchema = received2ndSchema.extend({
  serviceFeeJpy: z.coerce.number().min(0, 'Bắt buộc có phí dịch vụ (serviceFeeJpy)'),
  exchangeRate: z.coerce.number().min(0, 'Bắt buộc có tỷ giá (exchangeRate)'),
  serviceFeeVnd: z.coerce.number().min(0, 'Bắt buộc có phí dịch vụ VNĐ (serviceFeeVnd)'),
});

export const revisionSchema = z.object({
  revisionNote: z.string().min(1, 'Bắt buộc nhập lý do yêu cầu bổ sung/sửa đổi'),
});
