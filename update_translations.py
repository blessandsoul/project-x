import json
import os

def update_json_file(file_path, new_data, language):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Merge new_data into data
    for key, value in new_data.items():
        if key in data:
            if isinstance(value, dict):
                for sub_key, sub_value in value.items():
                    data[key][sub_key] = sub_value
            else:
                data[key] = value
        else:
            data[key] = value

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Updated {file_path}")

en_updates = {
  "common": {
    "cars": "Cars",
    "motorcycles": "Motorcycles",
    "vans": "Vans",
    "search": "Search",
    "filters": "Filters",
    "reset_filters": "Reset Filters",
    "make": "Make",
    "select_make": "Select Make",
    "model": "Model",
    "select_model": "Select Model",
    "first_select_make": "First Select Make",
    "year": "Year",
    "old": "Old",
    "price": "Price",
    "up_to": "Up to",
    "auction": "Auction",
    "fuel": "Fuel",
    "fuel_gas": "Gas",
    "fuel_diesel": "Diesel",
    "fuel_hybrid": "Hybrid",
    "fuel_electric": "Electric",
    "category": "Category",
    "drive": "Drive",
    "items_per_page": "Items per page",
    "apply": "Apply",
    "sort_by": "Sort by:",
    "retry": "Retry",
    "page": "Page",
    "prev": "Prev",
    "next": "Next",
    "mileage": "Mileage",
    "distance": "Distance",
    "view_details": "View Details",
    "close": "Close",
    "currency": "Currency",
    "days": "days"
  },
  "sort": {
    "relevance": "Relevance",
    "price_low": "Price (Low)",
    "price_high": "Price (High)",
    "year_new": "Year (New)",
    "year_old": "Year (Old)"
  },
  "auction": {
    "active_auctions": "Active Auctions",
    "description": "View demo listings from COPART, IAAI and Manheim auctions and use quick filters to find lots of interest.",
    "basic_search": "Basic Search",
    "transport_type": "What type of transport?",
    "search_placeholder_label": "Search (Make, Model or VIN)",
    "search_placeholder": "Ex: BMW X5, Camry 2018, JTMBFREV7JD123456",
    "search_min_chars": "Min 4 chars for search",
    "more_filters": "Additional Filters",
    "quick_filters": "Quick Filters",
    "company_importer": "Company / Importer",
    "search_by_company": "Search by Company",
    "vip_companies_only": "VIP Companies Only",
    "vip_companies_hint": "Showing only lots where this company has offers.",
    "brand_and_model": "Brand and Model",
    "exact_year_min_mileage": "Exact Year / Min Mileage",
    "technical_data": "Technical Data",
    "loading_data": "Loading real auction data...",
    "showing_results": "Showing {{count}} lots from {{total}} (Real API)",
    "no_results": "No cars found with these filters",
    "found_cars": "Found cars: {{count}}",
    "real_results": "Real Results (Vehicles + Quotes API)",
    "compare_prices": "Compare Vehicle Prices",
    "price_comparison": "Price Comparison",
    "select_companies_to_compare": "Select at least 2 companies to compare",
    "try_resetting": "Try resetting or changing filters and try again.",
    "real_lot_results": "Real Lot Results",
    "select_for_comparison": "Select for comparison",
    "select_vehicle_compare": "Select vehicle for comparison",
    "calculate_cost": "Calculate Cost",
    "compare_selected_prices": "Compare selected vehicle prices",
    "compare_description": "See most profitable total prices and delivery times for several vehicles together.",
    "comparing_count": "Comparing: {{count}} vehicles",
    "no_quotes_found": "No quotes found for selected vehicles.",
    "service_price_only": "Price for company service only (excluding car price)",
    "delivery_time": "Approx. delivery time: {{days}} days",
    "delivery_time_short": "Delivery time: {{days}} days",
    "company_quotes": "Company quotes for this vehicle",
    "calculation": "Calculation",
    "car_price": "Car price at auction",
    "transportation": "Transportation / Delivery",
    "company_service": "Company Service (service + broker)",
    "customs_insurance": "Customs + Insurance",
    "total_price": "Total Price (Car + Delivery + Service)"
  },
  "error": {
    "failed_to_load_data": "Failed to load real data"
  }
}

ka_updates = {
  "common": {
    "cars": "მანქანები",
    "motorcycles": "მოტოციკლები",
    "vans": "მიკროავტობუსები",
    "search": "ძებნა",
    "filters": "ფილტრები",
    "reset_filters": "ფილტრების განულება",
    "make": "მარკა",
    "select_make": "აირჩიეთ მარკა",
    "model": "მოდელი",
    "select_model": "აირჩიეთ მოდელი",
    "first_select_make": "ჯერ აირჩიეთ მარკა",
    "year": "წელი",
    "old": "ძ.",
    "price": "ფასი",
    "up_to": "მდე",
    "auction": "აუქციონი",
    "fuel": "საწვავი",
    "fuel_gas": "ბენზინი",
    "fuel_diesel": "დიზელი",
    "fuel_hybrid": "ჰიბრიდი",
    "fuel_electric": "ელექტრო",
    "category": "კატეგორია",
    "drive": "წამყვანი",
    "items_per_page": "რაოდენობა ერთ გვერდზე",
    "apply": "გამოყენება",
    "sort_by": "დალაგება:",
    "retry": "თავიდან ცდა",
    "page": "გვერდი",
    "prev": "წინა",
    "next": "შემდეგი",
    "mileage": "გარბენი",
    "distance": "დისტანცია",
    "view_details": "დეტალურად ნახვა",
    "close": "დახურვა",
    "currency": "ვალუტა",
    "days": "დღე"
  },
  "sort": {
    "relevance": "რელევანტურობით",
    "price_low": "ფასი (დაბალი)",
    "price_high": "ფასი (მაღალი)",
    "year_new": "წელი (ახალი)",
    "year_old": "წელი (ძველი)"
  },
  "auction": {
    "active_auctions": "აქტიური აუქციონები",
    "description": "ნახეთ სასაჩვენო ლისტინგები COPART, IAAI და Manheim აუქციონებიდან და გამოიყენეთ სწრაფი ფილტრები თქვენთვის საინტერესო ლოტების საპოვნელად.",
    "basic_search": "ძირითადი ძებნა",
    "transport_type": "რა სახის ტრანსპორტი?",
    "search_placeholder_label": "ძებნა (მარკა, მოდელი ან VIN)",
    "search_placeholder": "მაგ: BMW X5, Camry 2018, JTMBFREV7JD123456",
    "search_min_chars": "მინ. 4 სიმბოლო ძიებისთვის",
    "more_filters": "დამატებითი ფილტრები",
    "quick_filters": "სწრაფი ფილტრები",
    "company_importer": "კომპანია / იმპორტიორი",
    "search_by_company": "კომპანიით ძიება",
    "vip_companies_only": "მხოლოდ VIP კომპანიები",
    "vip_companies_hint": "ნაჩვენებია მხოლოდ ლოტები, სადაც ამ კომპანიის შეთავაზებებია.",
    "brand_and_model": "ბრენდი და მოდელი",
    "exact_year_min_mileage": "ზუსტი წელი / მინ. გარბენი",
    "technical_data": "ტექნიკური მონაცემები",
    "loading_data": "იტვირთება რეალური აუქციონის მონაცემები...",
    "showing_results": "ნაჩვენებია {{count}} ლოტი {{total}}-დან (რეალური API)",
    "no_results": "ამ ფილტრებით ვერ მოიძებნა მანქანები",
    "found_cars": "ნაპოვნი მანქანები: {{count}}",
    "real_results": "რეალური შედეგები (Vehicles + Quotes API)",
    "compare_prices": "ავტომობილების შედარება ფასებით",
    "price_comparison": "ფასების შედარება",
    "select_companies_to_compare": "მინიმუმ 2 კომპანია აირჩიეთ შესადარებლად",
    "try_resetting": "სცადეთ ფილტრების განულება ან შეცვლა და კიდევ ერთხელ სცადეთ.",
    "real_lot_results": "რეალური ლოტების შედეგები",
    "select_for_comparison": "შედარებისთვის არჩევა",
    "select_vehicle_compare": "აირჩიეთ მანქანა შედარებისთვის",
    "calculate_cost": "ღირებულების გათვლა",
    "compare_selected_prices": "შერჩეული მანქანების ფასების შედარება",
    "compare_description": "ნახეთ ყველაზე მომგებიანი სრული ფასები და მიწოდების დრო რამდენიმე მანქანისთვის ერთად.",
    "comparing_count": "შედარებაში: {{count}} მანქანა",
    "no_quotes_found": "შერჩეული მანქანებისთვის შეთავაზებები ვერ მოიძებნა.",
    "service_price_only": "ფასი მხოლოდ კომპანიის მომსახურებისთვის (მანქანის ფასის გარეშე)",
    "delivery_time": "მიწოდების მიახლოებითი დრო: {{days}} დღე",
    "delivery_time_short": "მიწოდების დრო: {{days}} დღე",
    "company_quotes": "კომპანიების შეთავაზებები ამ მანქანისთვის",
    "calculation": "კალკულაცია",
    "car_price": "მანქანის ფასი აუქციონზე",
    "transportation": "ტრანსპორტირება / მიწოდება",
    "company_service": "კომპანიის მომსახურება (service + broker)",
    "customs_insurance": "საბაჟო + დაზღვევა",
    "total_price": "სრული ფასი (მანქანა + მიწოდება + მომსახურება)"
  },
  "error": {
    "failed_to_load_data": "ვერ მოხერხდა რეალური მონაცემების ჩატვირთვა"
  }
}

update_json_file('client/public/locales/en/translation.json', en_updates, 'en')
update_json_file('client/public/locales/ka/translation.json', ka_updates, 'ka')

