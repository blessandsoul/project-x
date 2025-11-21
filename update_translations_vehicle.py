import json
import os

def update_translations():
    base_path = "client/public/locales"
    langs = ["en", "ka"]
    
    new_keys_en = {
        "vehicle_details": {
            "errors": {
                "not_found": "Vehicle identifier not found.",
                "fill_name_phone": "Please fill in name and phone number.",
                "phone_min_length": "Phone number must be at least 3 characters.",
                "select_min_one_company": "Select at least one company for the request.",
                "company_id_failed": "Failed to identify selected companies.",
                "request_failed": "Failed to send request. Please try again."
            },
            "support_modal": {
                "aria_label": "Choose more companies for support",
                "close_aria": "Close support window",
                "title": "Unlock choice up to 5 companies",
                "description": "Like our project on social networks and write a short review to send a request to multiple companies at once.",
                "liked_project": "I liked the project on social networks",
                "ready_to_review": "I am ready to share a short review",
                "your_review_label": "Your short review",
                "unlock_btn": "Unlock choice up to 5 companies"
            },
            "request_modal": {
                "aria_label": "Common request to multiple companies",
                "close_aria": "Close common request window",
                "title": "Common request to multiple companies",
                "selected_companies": "Selected companies: {{names}}",
                "comment_label": "Comment / Additional wishes",
                "min_budget": "Min. Budget (USD)",
                "max_budget": "Max. Budget (USD)",
                "desired_time": "Desired Time (Days)",
                "max_time": "Max. Accepted Time (Days)",
                "damage_tolerance": {
                    "title": "Damage Tolerance",
                    "minimal": "Minimal",
                    "average": "Average",
                    "any": "Any"
                },
                "additional_services": {
                    "title": "Additional Services",
                    "full_documents": "Full Documents",
                    "door_delivery": "Door Delivery",
                    "customs_support": "Customs Support"
                },
                "contact_channel": {
                    "title": "Preferred Contact Channel",
                    "call": "Call"
                },
                "priority": "Priority",
                "send_btn": "Send",
                "send_request_btn": "Send Request"
            },
            "gallery": {
                "zoom_aria": "Zoom main photo to full screen",
                "prev_aria": "Previous photos",
                "select_zoom_aria": "Select this photo to zoom",
                "next_aria": "Next photos",
                "unavailable": "Photos unavailable"
            },
            "info": {
                "basic_data": "Basic Data",
                "engine_transmission": "Engine / Transmission",
                "color_condition": "Color / Condition",
                "damages": "Damages",
                "keys_run_drive": "Keys / Run & Drive",
                "cylinders_equipment": "Cylinders / Equipment",
                "docs_auction": "Documents and Auction",
                "yard_location": "Auction Yard / Location",
                "market_repair_value": "Market / Repair Value",
                "calculated_price": "Calculated Price",
                "seller": "Seller",
                "title_doc": "TITLE / Document",
                "sale_date": "Sale Date",
                "created_updated": "Created / Updated",
                "api_fields": "Additional API Fields (Helper Info)"
            },
            "offers": {
                "title": "Company offers for this vehicle",
                "recalculating": "Recalculating...",
                "recalculate": "Recalculate",
                "compare_text": "Compare total import price and delivery time from various trusted companies from USA to Georgia.",
                "distance_to_poti": "Distance to Poti",
                "total_price_disclaimer": "Total price includes vehicle price, transportation, service and broker fees, customs and other fees are approximate.",
                "no_offers": "No vehicle import offers found at this stage. Try recalculating or returning later, or find another vehicle for import.",
                "back_to_catalog": "Back to Catalog",
                "find_other": "Find other vehicle",
                "best_shipping": "Best Shipping Price",
                "shipping_desc": "Transportation from USA to Georgia port (other services calculated separately)",
                "company_filter": "Company Filter",
                "fast_delivery": "Fast Delivery",
                "list_aria": "List of company offers",
                "premium_vip": "Premium / VIP Offers",
                "standard": "Standard Offers - Lower Price",
                "discount": "Discount",
                "approx_savings": "Approx. Savings",
                "individual_calc": "Individual Calculation",
                "discount_disclaimer": "Discount is relevant for current calculation and may change.",
                "trusted_partner": "Trusted Partner",
                "trusted_partner_desc": "Trusted Partner — selected importer based on our internal evaluation and user reviews.",
                "secure_payment": "Secure Payment",
                "secure_payment_desc": "Secure Payment — amount is fixed via trusted channel until importer confirms service.",
                "documents_full": "Full Documents",
                "documents_full_desc": "Full Documents — importer provides all necessary import and registration documents.",
                "documents": "Documents",
                "transport": "Transport",
                "customs": "Customs",
                "select_fee_aria": "Select fee for this company offer",
                "select_offer_aria": "Select this offer or deselect",
                "add_to_common_aria": "Add to common request for this company",
                "selected": "Selected",
                "selected_common": "Selected for common request",
                "select": "Select",
                "recent_imports": "Recent successful import examples",
                "import_completed_in": "Import completed in {{days}} days",
                "see_other_auctions": "See other active auctions",
                "not_found_msg": "Vehicle not found. Try again or return to search.",
                "continue_working": "Continue working with offers",
                "compare_desc": "Compare companies, choose best and return to catalog to see new vehicle.",
                "back_to_catalog_aria": "Return to company catalog",
                "go_to_offers_aria": "Go to company offers section",
                "see_offers": "See Offers",
                "send_request_aria": "Send request to selected companies"
            },
            "checkout": {
                "aria_label": "Checkout - {{company}}",
                "close_aria": "Close checkout window",
                "title": "Checkout",
                "total_import_price": "Total Import Price",
                "send_application": "Send Application",
                "received_aria": "Application Received - {{company}}",
                "close_confirmation_aria": "Close confirmation window",
                "received_title": "Application Received",
                "received_desc": "We will transfer your application to the importer and they will contact you on the next business day.",
                "contact_importer": "Contact Importer",
                "go_to_company": "Go to Company Page",
                "detailed_price_aria": "Detailed Price - {{company}}",
                "close_price_check_aria": "Close price check",
                "fullscreen_photo_aria": "Fullscreen photo view",
                "close": "Close"
            }
        },
        "common": {
            "name": "Name",
            "phone": "Phone",
            "any": "Any",
            "close": "Close",
            "reviews": "reviews",
            "price": "Price"
        }
    }

    new_keys_ka = {
        "vehicle_details": {
            "errors": {
                "not_found": "ავტომობილის იდენტიფიკატორი ვერ მოიძებნა.",
                "fill_name_phone": "გთხოვთ შეავსოთ სახელი და ტელეფონის ნომერი.",
                "phone_min_length": "ტელეფონის ნომერი უნდა შეიცავდეს მინიმუმ 3 სიმბოლოს.",
                "select_min_one_company": "აირჩიეთ მინიმუმ ერთი კომპანია საერთო მოთხოვნისთვის.",
                "company_id_failed": "ვერ მოხერხდა არჩეული კომპანიების იდენტიფიკაცია.",
                "request_failed": "ვერ მოხერხდა მოთხოვნის გაგზავნა. სცადეთ კიდევ ერთხელ."
            },
            "support_modal": {
                "aria_label": "აირჩიე მეტი კომპანია მხარდაჭერისთვის",
                "close_aria": "დახურე მხარდაჭერის ფანჯარა",
                "title": "გახსენი არჩევანი 5 კომპანიამდე",
                "description": "დაალაიქე ჩვენი პროექტი სოციალურ ქსელებში და დაწერე მოკლე შეფასება, რათა ერთდროულად რამდენიმე კომპანიას გაუგზავნო მოთხოვნა.",
                "liked_project": "მე დავუჭირე მხარი პროექტს სოციალურ ქსელებში",
                "ready_to_review": "მზად ვარ გავუზიარო მოკლე შეფასება",
                "your_review_label": "შენი მოკლე შეფასება",
                "unlock_btn": "გახსენი არჩევანი 5 კომპანიამდე"
            },
            "request_modal": {
                "aria_label": "საერთო მოთხოვნა რამდენიმე კომპანიაზე",
                "close_aria": "დახურე საერთო მოთხოვნის ფანჯარა",
                "title": "საერთო მოთხოვნა რამდენიმე კომპანიაზე",
                "selected_companies": "არჩეული კომპანიები: {{names}}",
                "comment_label": "კომენტარი / დამატებითი სურვილები",
                "min_budget": "მინ. ბიუჯეტი (USD)",
                "max_budget": "მაქს. ბიუჯეტი (USD)",
                "desired_time": "სასურველი ვადა (დღე)",
                "max_time": "მაქს. მისაღები ვადა (დღე)",
                "damage_tolerance": {
                    "title": "ზიანის tolerate-იანობა",
                    "minimal": "მინიმალური",
                    "average": "საშუალო",
                    "any": "ნებისმიერი"
                },
                "additional_services": {
                    "title": "დამატებითი სერვისები",
                    "full_documents": "სრული დოკუმენტები",
                    "door_delivery": "მიწოდება მისამართზე",
                    "customs_support": "საბაჟო მხარდაჭერა"
                },
                "contact_channel": {
                    "title": "სასურველი საკონტაქტო არხი",
                    "call": "ზარი"
                },
                "priority": "პრიორიტეტი",
                "send_btn": "გაგზავნა",
                "send_request_btn": "გაგზავნა მოთხოვნა"
            },
            "gallery": {
                "zoom_aria": "გაადიდე მთავარი ფოტო სრულ ეკრანზე",
                "prev_aria": "წინა ფოტოები",
                "select_zoom_aria": "აირჩიე ეს ფოტო გასადიდებლად",
                "next_aria": "შემდეგი ფოტოები",
                "unavailable": "ფოტოები მიუწვდომელია"
            },
            "info": {
                "basic_data": "ძირითადი მონაცემები",
                "engine_transmission": "ძრავი / ტრანსმისია",
                "color_condition": "ფერი / მდგომარეობა",
                "damages": "დაზიანებები",
                "keys_run_drive": "გასაღებები / Run & Drive",
                "cylinders_equipment": "ცილინდრები / აღჭურვილობა",
                "docs_auction": "დოკუმენტები და აუქციონი",
                "yard_location": "აუქციონის ეზო / მდებარეობა",
                "market_repair_value": "საბაზრო / შეკეთების ღირებულება",
                "calculated_price": "გამოთვლილი ფასი",
                "seller": "გამყიდველი",
                "title_doc": "TITLE / დოკუმენტი",
                "sale_date": "გაყიდვის თარიღი",
                "created_updated": "შექმნა / განახლება",
                "api_fields": "დამატებითი API ველები (დამხმარე ინფორმაცია)"
            },
            "offers": {
                "title": "კომპანიების შეთავაზებები ამ ავტომობილზე",
                "recalculating": "გადათვლა...",
                "recalculate": "გადათვლა",
                "compare_text": "შეადარე იმპორტის სრული ფასი და მიწოდების დრო სხვადასხვა სანდო კომპანიისგან აშშ-დან საქართველოში.",
                "distance_to_poti": "დისტანცია ფოთამდე",
                "total_price_disclaimer": "სრული ფასი მოიცავს ფასი მანქანის, ტრანსპორტირებას, მომსახურებისა და საბროკერო საფასურს, საბაჟო და სხვა გადასახადები წარმოდგენილია დაახლოებით.",
                "no_offers": "ამ ეტაპზე ავტომობილის იმპორტის შეთავაზებები არ არის ნაპოვნი. სცადეთ გადათვლა ან მოგვიანებით დაბრუნება, ან მოიძიეთ სხვა ავტომობილი იმპორტისთვის.",
                "back_to_catalog": "კატალოგში დაბრუნება",
                "find_other": "მოძებნე სხვა ავტომობილი",
                "best_shipping": "საუკეთესო ტრანსპორტირების ფასი",
                "shipping_desc": "ტრანსპორტირება აშშ-დან საქართველოს პორტამდე (სხვა მომსახურება ცალკე ითვლება)",
                "company_filter": "კომპანიების ფილტრი",
                "fast_delivery": "სწრაფი მიწოდება",
                "list_aria": "კომპანიების შეთავაზებების სია",
                "premium_vip": "Premium / VIP შეთავაზებები",
                "standard": "სტანდარტული შეთავაზებები — უფრო დაბალი ფასით",
                "discount": "ფასდაკლება",
                "approx_savings": "დაახლოებითი ეკონომია",
                "individual_calc": "ინდივიდუალური გათვლა",
                "discount_disclaimer": "ფასდაკლება აქტუალურია მიმდინარე კალკულაციისთვის და შეიძლება შეიცვალოს.",
                "trusted_partner": "სანდო პარტნიორი",
                "trusted_partner_desc": "სანდო პარტნიორი — ჩვენი შიდა შეფასებით და მომხმარებელთა გამოხმაურებებით შერჩეული იმპორტერი.",
                "secure_payment": "დაცული გადახდა",
                "secure_payment_desc": "დაცული გადახდა — თანხა იფიქსირება სანდო არხით, სანამ იმპორტერი არ დაადასტურებს მომსახურებას.",
                "documents_full": "დოკუმენტები სრულად",
                "documents_full_desc": "დოკუმენტები სრულად — იმპორტერი უზრუნველყოფს ყველა საჭირო იმპორტის და რეგისტრაციის დოკუმენტის მომზადებას.",
                "documents": "დოკუმენტები",
                "transport": "ტრანსპორტირება",
                "customs": "საბაჟო",
                "select_fee_aria": "გამოყავი საფასური ამ კომპანიის შეთავაზებისთვის",
                "select_offer_aria": "აირჩიე ეს შეთავაზება ან მოხსენი არჩევანი",
                "add_to_common_aria": "დამატება საერთო მოთხოვნაში ამ კომპანიისთვის",
                "selected": "არჩეულია",
                "selected_common": "არჩეულია საერთო მოთხოვნისთვის",
                "select": "არჩევა",
                "recent_imports": "ბოლო წარმატებული იმპორტის მაგალითები",
                "import_completed_in": "იმპორტი დასრულდა {{days}} დღეში",
                "see_other_auctions": "ნახე სხვა აქტიური აუქციონები",
                "not_found_msg": "ავტომობილი ვერ მოიძებნა. სცადეთ კიდევ ერთხელ ან დაბრუნდით ძიებაზე.",
                "continue_working": "გაგრძელე მუშაობა შეთავაზებებთან",
                "compare_desc": "შეადარე კომპანიები, აირჩიე საუკეთესო და დაბრუნდი კატალოგში ახალი ავტომობილის სანახავად.",
                "back_to_catalog_aria": "დაბრუნდი კომპანიების კატალოგში",
                "go_to_offers_aria": "გადადი კომპანიების შეთავაზებების სექციაზე",
                "see_offers": "ნახე შეთავაზებები",
                "send_request_aria": "გაგზავნა მოთხოვნის გაგზავნა არჩეული კომპანიებისთვის"
            },
            "checkout": {
                "aria_label": "შეკვეთის გაფორმება - {{company}}",
                "close_aria": "დახურე შეკვეთის გაფორმების ფანჯარა",
                "title": "შეკვეთის გაფორმება",
                "total_import_price": "სრული ფასი იმპორტზე",
                "send_application": "გაგზავნა განაცხადი",
                "received_aria": "განაცხადი მიღებულია - {{company}}",
                "close_confirmation_aria": "დახურე დადასტურების ფანჯარა",
                "received_title": "განაცხადი მიღებულია",
                "received_desc": "ჩვენ გადავცემთ თქვენს განაცხადს იმპორტერს და ის დაგიკავშირდებათ უახლოეს სამუშაო დღეს.",
                "contact_importer": "დაუკავშირდი იმპორტერს",
                "go_to_company": "გადადი კომპანიის გვერდზე",
                "detailed_price_aria": "დეტალური ფასი იმპორტზე - {{company}}",
                "close_price_check_aria": "დახურე ფასის დეტალური ჩეკი",
                "fullscreen_photo_aria": "ფოტოს სრულეკრანიანი ჩვენება",
                "close": "დახურვა"
            }
        },
        "common": {
            "name": "სახელი",
            "phone": "ტელეფონი",
            "any": "ნებისმიერი",
            "close": "დახურვა",
            "reviews": "შეფასება",
            "price": "ფასი"
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
            data["common"][key] = value

        # Update vehicle_details
        if "vehicle_details" not in data:
            data["vehicle_details"] = {}
        
        for section, content in new_keys["vehicle_details"].items():
            if section not in data["vehicle_details"]:
                data["vehicle_details"][section] = content
            else:
                # Deep merge for sections
                for key, value in content.items():
                    if isinstance(value, dict):
                        if key not in data["vehicle_details"][section]:
                             data["vehicle_details"][section][key] = value
                        else:
                             for k, v in value.items():
                                 data["vehicle_details"][section][key][k] = v
                    else:
                        data["vehicle_details"][section][key] = value
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"Updated {file_path}")

if __name__ == "__main__":
    update_translations()

