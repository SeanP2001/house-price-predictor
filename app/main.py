import joblib
import pandas as pd

from fastapi import FastAPI
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# creating app
app = FastAPI()

# Mount the "static" directory at the /static path
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Load the ML Model
model = joblib.load("models/house_price_model.pkl")

# HouseData Model
class HouseData(BaseModel):
    sqft_living: int
    lat: float 
    long: float
    bedrooms: int
    bathrooms: float
    

# Test API Endpoint
@app.get("/test/")
def first_example():
    return {"message": "Hello, FastAPI!"}


# Predict House Price Endpoint
# Take a HouseData model, convert to a dataframe, use the ML model to predict the price 
# and return a json containing the prediction
@app.post("/predict-house-price/")
async def predict_house_price(house_data: HouseData):
    
    house_dict = house_data.model_dump()
    house_df = pd.DataFrame([house_dict])
    
    prediction = model.predict(house_df)
    
    return {"predicted_price_usd": prediction[0]}


# Main endpoint serves a HTML form
@app.get("/")
async def main():
    return FileResponse('app/templates/index.html')