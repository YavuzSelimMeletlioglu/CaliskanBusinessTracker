from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np

app = FastAPI()
model = joblib.load("model.pkl")

class Features(BaseModel):
    malzeme_tipi: int
    kaplama_kalinligi: float
    yuzey_alani: float
    agirlik: float
    on_islem_suresi: float
    sicaklik: float

@app.post("/predict")
def predict(data: Features):
    X = np.array([[data.malzeme_tipi, data.kaplama_kalinligi, data.yuzey_alani,
                   data.agirlik, data.on_islem_suresi, data.sicaklik]])
    y_pred = model.predict(X)
    return {"tahmini_sure": round(y_pred[0], 2)}