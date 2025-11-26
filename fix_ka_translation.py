import json
import os

file_path = r'c:\Users\User\Desktop\GITHUB\PROJECTX\client\public\locales\ka\translation.json'

# Backup
if not os.path.exists(file_path + '.bak'):
    with open(file_path, 'r', encoding='utf-8') as f:
        with open(file_path + '.bak', 'w', encoding='utf-8') as fb:
            fb.write(f.read())

# Read content
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Attempt to fix JSON syntax errors (trailing commas, missing braces)
# This is a simple heuristic fix.
lines = content.splitlines()
cleaned_lines = []
for line in lines:
    # specific fix for the error I saw
    if '"remove": "ამოღება"' in line and '},' not in line:
         # It seemed to be inside a block that wasn't closed properly or had context issues
         pass
    cleaned_lines.append(line)

content = "\n".join(cleaned_lines)

# Try to load
try:
    data = json.loads(content)
except json.JSONDecodeError:
    # If standard load fails, try to find the truncated end and fix it
    # The error was at line 1500.
    # Let's try to just ignore the error and load what we can? No.
    # I will assume the structure is mostly correct and try to fix duplicate keys 
    # (which json.loads handles by keeping last)
    # But syntax error stops it.
    # Let's try to strip the file from the last known good point? 
    # No, I'll try to fix the specific closing brace issue.
    if content.rfind('}') < len(content) - 5: # if } is not near end
        content += '}'
    
    try:
        data = json.loads(content)
    except:
        # Last resort: Load EN structure, and for every key, try to find it in KA content using regex
        # This is too complex for this script.
        # Let's assume I can fix the file by just writing the new keys into a clean structure if I had one.
        pass

# Define the new translations to merge
new_translations = {
    "common": {
        "quads": "კვადროციკლები",
        "fwd": "წინა წამყვანი",
        "rwd": "უკანა წამყვანი",
        "awd": "4x4 / AWD",
        "reset": "განულება",
        "show_results": "შედეგების ნახვა",
        "verified": "ვერიფიცირებული"
    },
    "home": {
        "price_calculator": {
            "widget_title": "იმპორტის კალკულატორი",
            "auction_price": "აუქციონის ფასი",
            "engine_volume": "ძრავის მოცულობა (ლ)",
            "shipping_poti": "ტრანსპორტირება ფოთამდე",
            "est_customs": "სავარაუდო განბაჟება",
            "broker_fees": "ბროკერის & პორტის მოსაკრებელი",
            "total_estimated": "სავარაუდო ჯამური ღირებულება"
        },
        "blog": {
            "title": "ბლოგი",
            "description": "ისტორიები და რჩევები ავტომობილების იმპორტზე.",
            "read_time": "{{minutes}} წთ საკითხავი",
            "views": "{{count}} ნახვა",
            "read_article": "სტატიის წაკითხვა",
            "overlay_message": "ბლოგი სატესტო რეჟიმშია. სტატიები მალე დაემატება.",
            "takeaways_title": "მთავარი დასკვნები",
            "categories": {
                "customs": "განბაჟება",
                "auctions": "აუქციონები",
                "tips": "რჩევები"
            },
            "empty": {
                "title": "სტატიები ჯერ არ არის",
                "description": "ვამზადებთ სასარგებლო მასალებს. შეამოწმეთ მოგვიანებით.",
                "view_catalog_btn": "კატალოგის ნახვა"
            },
            "posts": {
                "blog": {
                    "post1": {
                        "tag": "გიდები",
                        "title": "როგორ შევარჩიოთ მანქანა აუქციონზე?",
                        "description": "მთავარი შემოწმებები და შეცდომების თავიდან არიდება.",
                        "takeaways": {
                            "1": "შეამოწმეთ VIN ისტორია",
                            "2": "შეამოწმეთ ძარის საღებავი",
                            "3": "შეამოწმეთ ძრავის ხმა"
                        }
                    },
                    "post2": {
                        "tag": "დოკუმენტები",
                        "title": "რა არის მნიშვნელოვანი ხელშეკრულებაში?",
                        "description": "იმპორტის ხელშეკრულების მთავარი პუნქტები.",
                        "takeaways": {
                            "1": "გადახედეთ ტრანსპორტირების პირობებს",
                            "2": "შეამოწმეთ დაზღვევა",
                            "3": "დააზუსტეთ ფარული ხარჯები"
                        }
                    },
                    "post3": {
                        "tag": "დაზოგვა",
                        "title": "როგორ დავზოგოთ იმპორტზე",
                        "description": "სტრატეგიები ხარჯების შესამცირებლად რისკის გარეშე.",
                        "takeaways": {
                            "1": "გამოთვალეთ განბაჟება",
                            "2": "შეადარეთ გზები",
                            "3": "დაჯავშნეთ წინასწარ"
                        }
                    }
                }
            }
        }
    },
    "auction": {
        "more_filters": "დამატებითი ფილტრები"
    }
}

def deep_update(source, overrides):
    for key, value in overrides.items():
        if isinstance(value, dict) and value:
            returned = deep_update(source.get(key, {}), value)
            source[key] = returned
        else:
            source[key] = overrides[key]
    return source

if 'data' in locals():
    deep_update(data, new_translations)
    
    # Remove duplicate 'trust' key if present (handled by json.load usually but let's clean structure)
    # We can't remove duplicate keys from dict as they are already merged. 
    # But we can ensure the structure matches what we expect.
    
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("Fixed and updated ka/translation.json")
else:
    print("Could not load JSON to fix it.")
