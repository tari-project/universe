
# https://gist.github.com/metalaureate/b4bc4f11c1f47a8100e319884c4edd70

import os
import json
import csv
import argparse

# Function to recursively find JSON files
def find_json_files(base_directory):
    json_files = []
    for root, _, files in os.walk(base_directory):
        for file in files:
            if file.endswith(".json"):
                json_files.append(os.path.join(root, file))
    return json_files

# Function to load a JSON file and return its content along with the file name
def load_json(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f), os.path.basename(file_path)

# Function to load keys from all English JSON files
def load_en_keys(en_json_files):
    all_keys = set()
    for json_file in en_json_files:
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            all_keys.update(data.keys())
    return all_keys

# Function to compare the English keys with other locale keys
def compare_keys(en_data, other_locale_data):
    en_keys = set(en_data.keys())
    other_keys = set(other_locale_data.keys())

    missing_keys = en_keys - other_keys
    extraneous_keys = other_keys - en_keys

    return missing_keys, extraneous_keys

# Function to search for keys in all files recursively under the search path
def search_for_key_in_files(key, search_path):
    for root, _, files in os.walk(search_path):
        for file in files:
            file_path = os.path.join(root, file)
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    contents = f.read()
                    if key in contents:
                        return True  # Key is found
            except:
                pass  # Skip unreadable files
    return False  # Key not found

# Function to write a CSV for English labels
def write_english_labels_csv(en_data, output_file):
    with open(output_file, mode='w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file, quoting=csv.QUOTE_ALL)
        writer.writerow(["label_key", "value", "json_file"])
        for (label_key, json_file), value in en_data.items():
            writer.writerow([label_key, value, json_file])

# Function to write a consolidated comparison CSV for all locales
def write_consolidated_comparison_csv(comparison_data, output_file):
    with open(output_file, mode='w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file, quoting=csv.QUOTE_ALL)
        writer.writerow(["locale", "status", "label_key", "json_file"])
        for locale, data in comparison_data.items():
            for key, json_file in data['missing_keys']:
                writer.writerow([locale, "missing", key, json_file])
            for key, json_file in data['extraneous_keys']:
                writer.writerow([locale, "extraneous", key, json_file])

# Function to write unused keys to a CSV file
def write_unused_keys_to_csv(unused_keys, output_file):
    with open(output_file, mode='w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file, quoting=csv.QUOTE_ALL)
        writer.writerow(["unused_key"])
        for key in unused_keys:
            writer.writerow([key])

# Unused keys function
def find_unused_keys(en_locale_path, search_base_path, output_dir):
    en_json_files = find_json_files(en_locale_path)
    all_en_keys = load_en_keys(en_json_files)
    
    unused_keys = []
    for key in all_en_keys:
        print(f"Searching for key: {key}")
        if not search_for_key_in_files(key, search_base_path):
            unused_keys.append(key)

    output_file = os.path.join(output_dir, 'unused_keys.csv')
    write_unused_keys_to_csv(unused_keys, output_file)
    print(f"Unused keys written to {output_file}")

# Key comparison function
def compare_keys_in_locales(base_path, en_path, output_dir):
    en_files = find_json_files(en_path)
    all_en_data = {}
    for en_file in en_files:
        en_data, json_file = load_json(en_file)
        all_en_data.update({(key, json_file): value for key, value in en_data.items()})
    
    english_labels_output_file = os.path.join(output_dir, 'english_labels.csv')
    write_english_labels_csv(all_en_data, english_labels_output_file)

    comparison_data = {}
    other_locales = [d for d in os.listdir(base_path) if os.path.isdir(os.path.join(base_path, d)) and d != 'en']

    for locale in other_locales:
        locale_path = os.path.join(base_path, locale)
        locale_files = find_json_files(locale_path)
        locale_data = {}
        for locale_file in locale_files:
            locale_json_data, json_file = load_json(locale_file)
            locale_data.update({(key, json_file): value for key, value in locale_json_data.items()})
        
        en_keys = set(key for key, _ in all_en_data.keys())
        locale_keys = set(key for key, _ in locale_data.keys())
        missing_keys = en_keys - locale_keys
        extraneous_keys = locale_keys - en_keys

        missing_keys_with_file = [(key, file) for (key, file) in all_en_data.keys() if key in missing_keys]
        extraneous_keys_with_file = [(key, file) for (key, file) in locale_data.keys() if key in extraneous_keys]

        comparison_data[locale] = {
            'missing_keys': missing_keys_with_file,
            'extraneous_keys': extraneous_keys_with_file
        }

    consolidated_output_file = os.path.join(output_dir, 'locale_key_comparison_consolidated.csv')
    write_consolidated_comparison_csv(comparison_data, consolidated_output_file)
    print(f"Comparison CSV written to {consolidated_output_file}")

# Main function to parse arguments and invoke appropriate functions
def main():
    parser = argparse.ArgumentParser(description="CLI tool for comparing locale JSON keys and finding unused keys.")
    parser.add_argument("mode", choices=["compare", "unused"], help="Mode of operation: 'compare' or 'unused'.")
    parser.add_argument("--en-locale-path", required=True, help="Path to the English locale directory.")
    parser.add_argument("--base-path", required=True, help="Base path for all locales (for comparison).")
    parser.add_argument("--output-dir", required=True, help="Directory to store the output CSV files.")
    parser.add_argument("--search-path", required=False, help="Path to search for unused keys (required for 'unused' mode).")

    args = parser.parse_args()

    if args.mode == "compare":
        compare_keys_in_locales(args.base_path, args.en_locale_path, args.output_dir)
    elif args.mode == "unused":
        if not args.search_path:
            print("Error: --search-path is required for 'unused' mode.")
            return
        find_unused_keys(args.en_locale_path, args.search_path, args.output_dir)

if __name__ == "__main__":
    main()

# python tool.py compare --en-locale-path /path/to/en --base-path /path/to/locales --output-dir /path/to/output
# python tool.py unused --en-locale-path /path/to/en --base-path /path/to/locales --search-path /path/to/src --output-dir /path/to/output
  
# Example usage:
# python i18n_checker.py compare --en-locale-path /Users/possum/Projects/tari/universe/public/locales/en --base-path /Users/possum/Projects/tari/universe/public/locales --output-dir ~/Downloads
# python i18n_checker.py unused --en-locale-path /Users/possum/Projects/tari/universe/public/locales/en --base-path /Users/possum/Projects/tari/universe/public/locales --search-path /Users/possum/Projects/tari/universe/src --output-dir ~/Downloads
