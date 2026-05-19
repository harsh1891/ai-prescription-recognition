import os
import pandas as pd

# Define paths to all data resources
fda_dataset_path = os.path.join('..', 'datasets', 'drugs.csv')
indian_dataset_path = os.path.join('..', 'datasets', 'indian_drugs.csv')
target_dataset_path = os.path.join('..', 'datasets', 'medicines.csv')

print("🚀 Starting Production-Grade Medicine Data Compiler...")

# --- 1. PARSE FDA GLOBAL DATASET ---
if os.path.exists(fda_dataset_path):
    print("⏳ Extracting Western FDA dataset...")
    try:
        fda_df = pd.read_csv(fda_dataset_path, usecols=['brand_name', 'active_ingredients'])
        fda_brands = fda_df['brand_name'].dropna().astype(str).str.strip().str.title()
        
        fda_ingredients = fda_df['active_ingredients'].dropna().astype(str)
        split_ingredients = fda_ingredients.str.split(';')
        flattened_ingredients = pd.Series([item.strip().title() for sublist in split_ingredients for item in sublist])
        
        fda_list = pd.concat([fda_brands, flattened_ingredients]).dropna().tolist()
        print(f"   Collected {len(set(fda_list))} unique items from FDA.")
    except Exception as e:
        print(f"⚠️ Error reading drugs.csv: {e}")
        fda_list = []
else:
    print("⚠️ Warning: drugs.csv not found.")
    fda_list = []


# --- 2. PARSE THE 1-LAKH INDIAN DATASET ---
if os.path.exists(indian_dataset_path):
    print("⏳ Extracting Indian Pharmaceutical database...")
    try:
        # Load the newly downloaded 1-lakh row dataset
        indian_df = pd.read_csv(indian_dataset_path)
        
        # This dataset uses 'brandName' or 'name' - we will dynamically check columns
        name_col = 'brandName' if 'brandName' in indian_df.columns else (
                   'name' if 'name' in indian_df.columns else indian_df.columns[0])
        
        indian_list = indian_df[name_col].dropna().astype(str).str.strip().str.title().tolist()
        print(f"   Collected {len(set(indian_list))} unique items from Indian Database.")
    except Exception as e:
        print(f"⚠️ Error reading indian_drugs.csv: {e}")
        indian_list = []
else:
    print(f"❌ Error: Cannot find '{indian_dataset_path}'. Please verify Step 1 download.")
    exit()


# --- 3. MERGE, DE-DUPLICATE, AND COMPILE MATRIX ---
print("⏳ Merging repositories and cleaning character strings...")
combined_meds = fda_list + indian_list

# Apply strict structural constraint: eliminate short noise/anomalies (strings < 3 chars)
final_unique_list = list(set([str(m).strip() for m in combined_meds if len(str(m).strip()) > 2]))
final_unique_list.sort()


# --- 4. EXPORT TO CENTRAL REPOSITORY ---
clean_medicines_df = pd.DataFrame(final_unique_list, columns=['canonical_name'])
clean_medicines_df.to_csv(target_dataset_path, index=False)

print("\n" + "="*50)
print(f"✅ Success! Compiled Unified Global-Local Database Matrix.")
print(f"🎯 Total Unique Validated Medications Logged: {len(clean_medicines_df)}")
print(f"📦 Target file updated: {target_dataset_path}")
print("="*50)