export const sendResponse = (res, data, emptyMessage = "Kayıt bulunamadı!") => {
  if (!data) {
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
