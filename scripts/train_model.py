from pathlib import Path
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.pipeline import Pipeline


SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent

DATASET_PATH = PROJECT_ROOT / "data" / "house_data.csv"
MODEL_PATH = PROJECT_ROOT / "models" / "house_price_model.pkl"

SELECTED_FEATURES = [
    "sqft_living",
    "lat",
    "long",
    "bedrooms",
    "bathrooms"
]


# Import the dataset and store it in a pandas dataframe (df)
df = pd.read_csv(DATASET_PATH)  

# Remove instances where bedrooms or bathrooms are 0, these are presumed to be invalid
df = df[
    (df["bedrooms"] > 0) &
    (df["bathrooms"] > 0)
]

# Separate the target variable (price) from the predictors
y=df['price']            
X=df[SELECTED_FEATURES]    

# Split the dataset into training and testing sets (with a 70/30 split)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=2)   


# Gradient Boosting model 
gb_model_pipeline = Pipeline([
    ("model", GradientBoostingRegressor(
        n_estimators=200,      # number of trees
        learning_rate=0.05,    # shrinkage factor (controls contribution of each tree)
        max_depth=3,           # depth of individual trees (controls complexity)
        random_state=2
    ))
])

# Fit the model to the training data
gb_model_pipeline.fit(X_train, y_train)

# Save the model so that it can be loaded for use in production
# (Ensure the directory exists)
MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
joblib.dump(gb_model_pipeline, MODEL_PATH)