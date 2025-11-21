import json
import os

def update_translations():
    base_path = "client/public/locales"
    langs = ["en", "ka"]
    
    new_keys_en = {
        "auction": {
            "company_search_placeholder": "e.g. Premium Auto Import..."
        },
        "common": {
            "company": "Company"
        }
    }

    new_keys_ka = {
        "auction": {
            "company_search_placeholder": "მაგ: Premium Auto Import..."
        },
        "common": {
            "company": "კომპანია"
        }
    }

    for lang in langs:
        file_path = os.path.join(base_path, lang, "translation.json")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        new_keys = new_keys_en if lang == "en" else new_keys_ka
        
        # Update common
        if "common" not in data:
            data["common"] = {}
        for key, value in new_keys["common"].items():
            if key not in data["common"]:
                print(f"Adding common.{key} to {lang}")
                data["common"][key] = value
            else:
                print(f"common.{key} already exists in {lang}")

        # Update auction
        if "auction" not in data:
            data["auction"] = {}
        for key, value in new_keys["auction"].items():
            if key not in data["auction"]:
                print(f"Adding auction.{key} to {lang}")
                data["auction"][key] = value
            else:
                print(f"auction.{key} already exists in {lang}")
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"Updated {file_path}")

if __name__ == "__main__":
    update_translations()

