import json
import os

def remove_duplicates():
    file_path = r"c:\Users\User\Desktop\GITHUB\PROJECTX\client\public\locales\en\translation.json"
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            # Loading into a dictionary automatically removes duplicates
            # Python's json parser will keep the last occurrence of a key
            data = json.load(f)
        
        # Write back the clean JSON
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        print(f"Successfully cleaned duplicates in {file_path}")
        
    except json.JSONDecodeError as e:
        print(f"JSON Error: {e}")
        
if __name__ == "__main__":
    remove_duplicates()
