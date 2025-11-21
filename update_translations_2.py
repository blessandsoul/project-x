import json
import os

def update_json_file(file_path, new_data):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Merge new_data into data (deep merge for 'auction')
    if 'auction' in new_data:
        if 'auction' not in data:
            data['auction'] = {}
        for key, value in new_data['auction'].items():
            data['auction'][key] = value

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Updated {file_path}")

en_updates = {
  "auction": {
    "calc_modal_title": "Single Company Calculation",
    "calc_modal_desc": "View a sample total price from a random company for this lot.",
    "best_total_price": "Best Total Price",
    "distance_to_poti": "Distance to Poti"
  }
}

ka_updates = {
  "auction": {
    "calc_modal_title": "კალკულაცია ერთი კომპანიისთვის",
    "calc_modal_desc": "ნახეთ ერთი შემთხვევითი კომპანიის სრული საკურიერო ფასის მაგალითი ამ ლოტისთვის.",
    "best_total_price": "საუკეთესო სრული ფასი",
    "distance_to_poti": "დისტანცია ფოთამდე"
  }
}

update_json_file('client/public/locales/en/translation.json', en_updates)
update_json_file('client/public/locales/ka/translation.json', ka_updates)

