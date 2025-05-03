export const sendResponse = (res, data, emptyMessage = "Kayıt bulunamadı!") => {
  if (!data || data.length === 0) {
    return res.status(404).json({
      success: false,
      data: [],
      message: emptyMessage,
    });
  }
  res.status(200).json({
    success: true,
    data,
    message: "Başarılı",
  });
};
