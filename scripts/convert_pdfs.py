import fitz  # PyMuPDF
import os

def convert_pdf_page_to_jpg(pdf_path, page_num, output_jpg_path):
    print(f"Converting {pdf_path} page {page_num} -> {output_jpg_path}")
    if not os.path.exists(pdf_path):
        print(f"Error: {pdf_path} does not exist!")
        return False
    
    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_jpg_path), exist_ok=True)
    
    doc = fitz.open(pdf_path)
    if page_num >= len(doc):
        print(f"Error: PDF only has {len(doc)} pages, page {page_num} is out of bounds.")
        return False
        
    page = doc.load_page(page_num)
    
    # Increase resolution (zoom factor, 2.0 = 2x resolution of the PDF)
    zoom = 2.0
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat)
    
    pix.save(output_jpg_path)
    doc.close()
    return True

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    templates_dir = os.path.join(base_dir, "public", "templates")
    
    tasks = [
        # Form 1: don_xin_lan_1.pdf -> don_xin_lan_1_p1.jpg, don_xin_lan_1_p2.jpg
        ("don_xin_lan_1.pdf", 0, "nenkin_lan1/don_xin_lan_1_p1.jpg"),
        ("don_xin_lan_1.pdf", 1, "nenkin_lan1/don_xin_lan_1_p2.jpg"),
        
        # Form 2: ininjyo_yoshiki_lan_1.pdf -> ininjyo_yoshiki_lan_1.jpg
        ("ininjyo_yoshiki_lan_1.pdf", 0, "nenkin_lan1/ininjyo_yoshiki_lan_1.jpg"),
        
        # Form 3 (Lần 2): giay_uy_thac_lan_2.pdf -> giay_uy_thac_lan_2.jpg
        ("giay_uy_thac_lan_2.pdf", 0, "nenkin_lan2/giay_uy_thac_lan_2.jpg"),
        
        # Form 4 (Lần 2): bang_1_2.pdf -> bang_1_2_p1.jpg, bang_1_2_p2.jpg
        ("bang_1_2.pdf", 0, "nenkin_lan2/bang_1_2_p1.jpg"),
        ("bang_1_2.pdf", 1, "nenkin_lan2/bang_1_2_p2.jpg"),
        
        # Form 5 (Lần 2): bang_3.pdf -> bang_3.jpg
        ("bang_3.pdf", 0, "nenkin_lan2/bang_3.jpg"),
    ]
    
    for pdf_name, page, out_rel in tasks:
        pdf_path = os.path.join(templates_dir, pdf_name)
        out_path = os.path.join(templates_dir, out_rel)
        convert_pdf_page_to_jpg(pdf_path, page, out_path)

if __name__ == "__main__":
    main()
