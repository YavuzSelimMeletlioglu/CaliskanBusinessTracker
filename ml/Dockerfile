FROM python:3.12.9-slim
WORKDIR /app
COPY . .
RUN pip install fastapi uvicorn scikit-learn joblib pydantic numpy
RUN python train_model.py
EXPOSE 8001
CMD ["uvicorn", "ml:app", "--host", "0.0.0.0", "--port", "8001"]