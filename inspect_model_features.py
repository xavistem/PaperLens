#!/usr/bin/env python3
"""
Script to inspect the exact features expected by the trained model
"""

import pickle
import pandas as pd

def inspect_model_features():
    """Load model and inspect the features it expects"""
    try:
        # Try to load the model with different approaches
        print("🔍 Attempting to load model...")
        
        # First, try loading with joblib if it was saved that way
        try:
            import joblib
            pipeline = joblib.load('../models/paperlens_xgb_pipeline.pkl')
            print("✅ Model loaded with joblib")
        except:
            # Fallback to pickle
            with open('../models/paperlens_xgb_pipeline.pkl', 'rb') as f:
                pipeline = pickle.load(f)
            print("✅ Model loaded with pickle")
        
        print(f"📦 Pipeline type: {type(pipeline)}")
        
        # Check if it's a sklearn pipeline
        if hasattr(pipeline, 'steps'):
            print(f"📋 Pipeline steps: {[step[0] for step in pipeline.steps]}")
            
            # Look for preprocessor step
            for step_name, step in pipeline.steps:
                print(f"\n🔧 Step: {step_name} ({type(step)})")
                
                if hasattr(step, 'transformers'):
                    print("   Transformers:")
                    for trans_name, transformer, columns in step.transformers:
                        print(f"      - {trans_name}: {type(transformer)}")
                        print(f"        Columns: {columns}")
                
                if hasattr(step, 'feature_names_in_'):
                    print(f"   Expected features: {step.feature_names_in_}")
        
        # Try to get feature names from the pipeline
        if hasattr(pipeline, 'feature_names_in_'):
            print(f"\n📊 Pipeline expects features: {pipeline.feature_names_in_}")
            return list(pipeline.feature_names_in_)
        
        # If pipeline has named_steps, try to get from preprocessor
        if hasattr(pipeline, 'named_steps') and 'preprocessor' in pipeline.named_steps:
            preprocessor = pipeline.named_steps['preprocessor']
            if hasattr(preprocessor, 'feature_names_in_'):
                print(f"\n📊 Preprocessor expects features: {preprocessor.feature_names_in_}")
                return list(preprocessor.feature_names_in_)
        
        return None
        
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        return None

def create_sample_dataframe(features):
    """Create a sample DataFrame with the expected features"""
    if not features:
        print("❌ No features found to create sample")
        return None
    
    print(f"\n🧪 Creating sample DataFrame with {len(features)} features:")
    
    # Create sample data
    sample_data = {}
    for feature in features:
        # Try to infer the data type and create appropriate sample value
        if 'year' in feature.lower():
            sample_data[feature] = 2020
        elif 'count' in feature.lower():
            sample_data[feature] = 5
        elif 'is_' in feature.lower() or feature.lower().endswith('_missing'):
            sample_data[feature] = False
        elif 'length' in feature.lower():
            sample_data[feature] = 50
        elif 'level' in feature.lower():
            sample_data[feature] = 1
        else:
            # Default numeric value
            sample_data[feature] = 1.0
    
    df = pd.DataFrame([sample_data])
    print("✅ Sample DataFrame created")
    print(f"📋 Features: {list(df.columns)}")
    
    return df

def test_prediction(pipeline, df):
    """Test prediction with sample data"""
    if pipeline is None or df is None:
        return False
    
    try:
        print("\n🤖 Testing prediction...")
        
        # Make prediction
        prediction = pipeline.predict(df)
        prediction_proba = pipeline.predict_proba(df)
        
        print(f"✅ Prediction successful!")
        print(f"🎯 Predicted class: {prediction[0]}")
        print(f"📊 Prediction probabilities: {prediction_proba[0]}")
        print(f"🔢 Risk score: {int(prediction_proba[0][1] * 100)}%")
        
        return True
        
    except Exception as e:
        print(f"❌ Prediction failed: {e}")
        return False

if __name__ == "__main__":
    print("🔬 PaperLens Model Feature Inspector")
    print("=" * 50)
    
    # Load model and inspect features
    features = inspect_model_features()
    
    if features:
        print(f"\n✅ Found {len(features)} expected features")
        
        # Save features to a file for the backend
        with open('model_features.txt', 'w') as f:
            for feature in features:
                f.write(f"{feature}\n")
        print("💾 Features saved to model_features.txt")
        
        # Try to load the model again for testing
        try:
            import joblib
            pipeline = joblib.load('../models/paperlens_xgb_pipeline.pkl')
        except:
            with open('../models/paperlens_xgb_pipeline.pkl', 'rb') as f:
                pipeline = pickle.load(f)
        
        # Create sample data and test
        df = create_sample_dataframe(features)
        success = test_prediction(pipeline, df)
        
        if success:
            print("\n🚀 Model is ready for integration!")
        else:
            print("\n⚠️ Model needs debugging")
            
    else:
        print("\n❌ Could not determine model features")
        print("💡 The model might need to be retrained or features need manual specification") 