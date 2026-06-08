import xml.etree.ElementTree as ET
from zipfile import ZipFile
from pathlib import Path

docx_path = "Portfolio.docx"
out_dir = Path("pngs")
out_dir.mkdir(exist_ok=True)

image_exts = (".png", ".jpg", ".jpeg")

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
R = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"


def para_text(p):
    """Return paragraph text, preserving line breaks from <w:br/> elements."""
    parts = []
    for el in p.iter():
        tag = el.tag.split("}", 1)[-1]
        if tag == "t":
            parts.append(el.text or "")
        elif tag == "br":
            parts.append("\n")
        elif tag == "tab":
            parts.append("\t")
    return "".join(parts).strip()


def para_image_rids(p):
    """Return embedded image relationship IDs in paragraph order."""
    rids = []
    for el in p.iter():
        if el.tag.endswith("}blip"):
            rid = el.attrib.get(f"{R}embed")
            if rid:
                rids.append(rid)
    return rids


with ZipFile(docx_path) as z:
    # 1. Extract image files
    extracted = {}
    for name in z.namelist():
        if name.startswith("word/media/") and name.lower().endswith(image_exts):
            out_path = out_dir / Path(name).name
            out_path.write_bytes(z.read(name))
            extracted[Path(name).name] = out_path
            print(f"Extracted {out_path}")

    # 2. Map relationship IDs to media filenames
    rels_root = ET.fromstring(z.read("word/_rels/document.xml.rels"))
    rid_to_filename = {}
    for rel in rels_root:
        target = rel.attrib.get("Target", "")
        if target.startswith("media/"):
            rid_to_filename[rel.attrib["Id"]] = Path(target).name

    # 3. Walk paragraphs in document order, pair each image with its
    #    nearest preceding non-empty text-only paragraph as its caption.
    doc_root = ET.fromstring(z.read("word/document.xml"))
    body = doc_root.find(f"{W}body")
    paras = body.findall(f"{W}p") if body is not None else []

    para_info = [(para_text(p), para_image_rids(p)) for p in paras]

    image_index = 0
    for i, (text, rids) in enumerate(para_info):
        for rid in rids:
            image_index += 1
            caption = ""
            for j in range(i - 1, -1, -1):
                prev_text, prev_rids = para_info[j]
                if prev_rids:
                    break  # earlier image — no caption found between
                if prev_text:
                    caption = prev_text
                    break
            cap_path = out_dir / f"image_{image_index}_caption.txt"
            cap_path.write_text(caption, encoding="utf-8")
            media_name = rid_to_filename.get(rid, "?")
            print(f"Caption {image_index} ({media_name}) -> {cap_path}")