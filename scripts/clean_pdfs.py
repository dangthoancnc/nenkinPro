import fitz  # PyMuPDF
import os

def clean_pdf(pdf_path):
    print(f"Cleaning PDF: {pdf_path}")
    if not os.path.exists(pdf_path):
        print(f"Error: {pdf_path} not found.")
        return
        
    try:
        doc = fitz.open(pdf_path)
        temp_path = pdf_path + ".tmp"
        
        # Save with clean=True to fix structure, cross-references and objects
        doc.save(temp_path, clean=True, deflate=True)
        doc.close()
        
        # Overwrite the original file
        os.replace(temp_path, pdf_path)
        print(f"Successfully cleaned and saved {pdf_path}")
    except Exception as e:
        print(f"Failed to clean {pdf_path}: {e}")

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    forms_dir = os.path.join(base_dir, "public", "forms")
    
    pdfs_to_clean = [
        "bang_1_2.pdf",
        "bang_3.pdf",
        "giay_uy_thac_lan_2.pdf",
        "don_xin_lan_1.pdf",
        "ininjyo_yoshiki_lan_1.pdf"
    ]
    
    for pdf_name in pdfs_to_clean:
        pdf_path = os.path.join(forms_dir, pdf_name)
        clean_pdf(pdf_path)

if __name__ == "__main__":
    main()
