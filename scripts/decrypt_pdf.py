import pypdf
import os

def decrypt_pdf(input_path, output_path):
    print(f"Reading {input_path}...")
    reader = pypdf.PdfReader(input_path)
    
    if reader.is_encrypted:
        print("PDF is encrypted. Attempting to decrypt with empty password...")
        try:
            reader.decrypt("")
        except Exception as e:
            print(f"Decryption failed: {e}")
            return False
            
    writer = pypdf.PdfWriter()
    for page in reader.pages:
        writer.add_page(page)
        
    print(f"Saving decrypted PDF to {output_path}...")
    with open(output_path, "wb") as f:
        writer.write(f)
    print("Done!")
    return True

if __name__ == "__main__":
    input_file = "public/forms/nouzeikanrinin.pdf"
    output_file = "public/forms/nouzeikanrinin.pdf"
    
    # Backup first
    backup_file = "public/forms/nouzeikanrinin_backup.pdf"
    if not os.path.exists(backup_file):
        os.rename(input_file, backup_file)
        decrypt_pdf(backup_file, output_file)
    else:
        decrypt_pdf(backup_file, output_file)
