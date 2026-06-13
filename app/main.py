import joblib
import pandas as pd

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# Restrict locations to within King County, WA
LAT_MIN = 47.1 
LAT_MAX = 47.8
LONG_MIN = -122.6
LONG_MAX = -121.3

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
def test():
    return {"message": "Hello, World!"}


# Predict House Price Endpoint
# Take a HouseData model, convert to a dataframe, use the ML model to predict the price 
# and return a json containing the prediction
@app.post("/predict-house-price/")
async def predict_house_price(house_data: HouseData):
    
    house_dict = house_data.model_dump()
    house_df = pd.DataFrame([house_dict])

    # Ensure the location is within the supported region
    if not (LAT_MIN <= house_df["lat"].iloc[0] <= LAT_MAX):
        raise HTTPException(
            status_code=400,
            detail=f"Latitude is outside of the supported region ({LAT_MIN}, {LAT_MAX})"
        )

    if not (LONG_MIN <= house_df["long"].iloc[0] <= LONG_MAX):
        raise HTTPException(
            status_code=400,
            detail=f"Longitude is outside of the supported region ({LONG_MIN}, {LONG_MAX})"
        )
    
    prediction = model.predict(house_df)
    
    return {"predicted_price_usd": prediction[0]}


# Main endpoint serves the HTML page with a form
@app.get("/")
async def main():
    return FileResponse('app/templates/index.html')