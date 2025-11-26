import json
import os

def update_file(path, updates):
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return
    
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    def deep_update(d, u):
        for k, v in u.items():
            if isinstance(v, dict):
                d[k] = deep_update(d.get(k, {}), v)
            else:
                d[k] = v
        return d

    deep_update(data, updates)
    
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Updated {path}")

ka_updates = {
    "catalog": {
        "card": {
            "view_profile": "პროფილი"
        }
    }
}

update_file(r'c:\Users\User\Desktop\GITHUB\PROJECTX\client\public\locales\ka\translation.json', ka_updates)
