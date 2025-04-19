from sklearn.ensemble import RandomForestRegressor
import joblib
import numpy as np

X = np.array([[1, 50, 2.5, 600, 12, 455], [2, 60, 3.0, 800, 14, 460]])
y = np.array([5.0, 6.5])

model = RandomForestRegressor()
model.fit(X, y)
joblib.dump(model, "model.pkl")