"""Create ~50 utility images. library.json is sparse on purpose."""

from __future__ import annotations

import json
import random
import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parents[1]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from PIL import Image, ImageDraw, ImageFont

from shared import config

# Painted content lives in PNG info (OCR stand-in). Not in library.json.
SPECS = [
    {"object_type": "medicine_label", "use": "cold/flu medicine photographed when sick", "text": "COLDRIL syrup\nFor cough & cold\nTake 10ml twice daily\nExp 2025-11", "scene": "phone photo of a carton on a wooden table"},
    {"object_type": "medicine_label", "use": "fever tablet strip after a night of illness", "text": "FEVERIN 500\nParacetamol tablets\n1 tab after food", "scene": "blister pack on bedside table"},
    {"object_type": "medicine_label", "use": "antibiotic course prescribed after a clinic visit", "text": "AXITHRO 250\nAzithromycin\nOnce daily 3 days", "scene": "pharmacy bag on kitchen counter"},
    {"object_type": "receipt", "use": "pharmacy bill to claim insurance", "text": "CITY PHARMA\nBill 1842\nCOLDRIL 186\nTotal INR 340", "scene": "thermal receipt photo"},
    {"object_type": "receipt", "use": "grocery bill for a reimbursement form", "text": "FRESH MART\nMilk 62  Bread 45\nTotal 890\n12 Mar", "scene": "crumpled paper receipt"},
    {"object_type": "receipt", "use": "cab receipt after airport drop", "text": "RIDE CO\nAirport drop\nINR 640\nTrip 09:12", "scene": "app screenshot of ride receipt"},
    {"object_type": "document_screenshot", "use": "WiFi password saved from the router card", "text": "WiFi: HomeNet_5G\nPassword: riverSTONE!4", "scene": "screenshot of notes app"},
    {"object_type": "document_screenshot", "use": "OTP / account recovery screenshot", "text": "Your verification code is 482193\nDo not share", "scene": "SMS screenshot"},
    {"object_type": "document_screenshot", "use": "school form instructions from a WhatsApp group", "text": "Submit ID + address proof\nDeadline Friday 4pm", "scene": "WhatsApp screenshot"},
    {"object_type": "document_screenshot", "use": "bank IFSC screenshot before a transfer", "text": "HDFC0001234\nA/c 501000112233", "scene": "banking app screenshot"},
    {"object_type": "id_card", "use": "office ID photographed for a visitor form", "text": "NORTHGATE LABS\nID 8841\nPriya S", "scene": "plastic ID on desk"},
    {"object_type": "id_card", "use": "gym membership shown at the door", "text": "PULSE GYM\nMember 2201\nValid 2026", "scene": "card on gym counter"},
    {"object_type": "id_card", "use": "library card for an online renewal", "text": "CITY LIBRARY\nCard L-9033", "scene": "card next to a book"},
    {"object_type": "boarding_pass", "use": "boarding pass screenshot before a Goa flight", "text": "6E 204 DEL→GOI\nSeat 14C\nGate 12  08:40", "scene": "airline app screenshot"},
    {"object_type": "boarding_pass", "use": "return flight barcode at the airport", "text": "6E 205 GOI→DEL\nSeat 21A\nBoarding 19:10", "scene": "phone screenshot of barcode"},
    {"object_type": "whiteboard_note", "use": "meeting notes before writing the spec", "text": "Q2 goals\n- search v2\n- privacy review", "scene": "office whiteboard photo"},
    {"object_type": "whiteboard_note", "use": "wifi of a rented flat scribbled on a board", "text": "wifi: Guest_2G\npwd: mango@12", "scene": "apartment whiteboard"},
    {"object_type": "document_screenshot", "use": "electricity bill for an address proof upload", "text": "BESCOM\nAccount 332190\nAmount 2140\nDue 18 Apr", "scene": "PDF screenshot"},
    {"object_type": "document_screenshot", "use": "rent agreement first page for a visa form", "text": "LEAVE AND LICENSE\nFlat 4B, Indiranagar\n11 months", "scene": "document scan screenshot"},
    {"object_type": "other", "use": "vaccine certificate screenshot for travel", "text": "COVID-19 CERT\nDose 2  2022-01-14", "scene": "CoWIN-style screenshot"},
    {"object_type": "receipt", "use": "hospital bill after a fever visit", "text": "CARE CLINIC\nConsult 500\nMeds 340\nTotal 840", "scene": "clinic receipt photo"},
    {"object_type": "medicine_label", "use": "eye drops after a red-eye week", "text": "LUBRICARE drops\n2 drops 4x daily", "scene": "small bottle close-up"},
    {"object_type": "document_screenshot", "use": "PAN / tax screenshot for a KYC upload", "text": "PAN AABCP1234F\nName on card: P SHARMA", "scene": "cropped document photo"},
    {"object_type": "other", "use": "parcel tracking screenshot when it was delayed", "text": "Tracking IN123456789\nOut for delivery", "scene": "courier app screenshot"},
    {"object_type": "whiteboard_note", "use": "kids school timetable photographed on the fridge", "text": "Tue: 3pm art\nThu: 4pm maths", "scene": "paper on fridge"},
    {"object_type": "receipt", "use": "restaurant bill split with friends", "text": "CAFE LANE\n2x pasta 780\nTotal 1240", "scene": "cafe receipt"},
    {"object_type": "document_screenshot", "use": "appointment confirmation for a visa centre", "text": "VFS appointment\nTue 10:30\nBring originals", "scene": "email screenshot"},
    {"object_type": "id_card", "use": "driving licence photo for a rental form", "text": "DL KA01 20210012345\nValid 2031", "scene": "licence on dashboard"},
    {"object_type": "medicine_label", "use": "insulin / chronic med box for a refill reminder", "text": "GLUCOSTAT\nKeep refrigerated\n30 cartridges", "scene": "box in fridge door"},
    {"object_type": "other", "use": "warranty sticker on a router", "text": "SN AX99821\nWarranty 2 years", "scene": "underside of router"},
    {"object_type": "document_screenshot", "use": "UPI payment screenshot as proof to a landlord", "text": "Paid ₹18,000\nto R MEHTA\nRent March", "scene": "UPI success screenshot"},
    {"object_type": "receipt", "use": "medicine GST invoice for IT returns", "text": "Tax invoice\nGST 18%\nInv M-4401", "scene": "printed invoice"},
    {"object_type": "boarding_pass", "use": "train ticket screenshot for a reimbursement", "text": "IRCTC\nSBC → MAS\n3A  S8  42", "scene": "rail app screenshot"},
    {"object_type": "whiteboard_note", "use": "password hint a parent wrote on a pad", "text": "NetBanking\nhint: first pet + 19", "scene": "notepad photo"},
    {"object_type": "document_screenshot", "use": "Aadhaar address page for a SIM KYC", "text": "Address\n12, 4th main\nBengaluru 560038", "scene": "masked ID screenshot"},
    {"object_type": "other", "use": "car parking slot number photographed in a mall", "text": "P2-A-118", "scene": "pillar sign photo"},
    {"object_type": "receipt", "use": "diagnostic lab bill after a blood test", "text": "PATH LAB\nCBC + Vitamin D\nINR 2100", "scene": "lab receipt"},
    {"object_type": "medicine_label", "use": "vitamin bottle to reorder the same brand", "text": "D3 60K\nOnce weekly", "scene": "bottle on shelf"},
    {"object_type": "document_screenshot", "use": "hotel booking voucher for a visa file", "text": "Bay Inn Goa\nCheck-in 12 Jan\n2 nights", "scene": "booking.com screenshot"},
    {"object_type": "id_card", "use": "college ID for an exam hall", "text": "NITK SURATHKAL\nRoll 19CS0123", "scene": "ID lanyard photo"},
    {"object_type": "other", "use": "gas cylinder booking SMS screenshot", "text": "Booking 77821\nDelivery tomorrow AM", "scene": "SMS screenshot"},
    {"object_type": "whiteboard_note", "use": "sprint dates from a team offsite", "text": "Sprint 14\nMon kickoff\nFri demo", "scene": "flipchart photo"},
    {"object_type": "receipt", "use": "optics bill after buying glasses", "text": "VISION CO\nLens + frame\nINR 4200", "scene": "store receipt"},
    {"object_type": "document_screenshot", "use": "insurance policy number screenshot", "text": "Health policy\nHI/2023/998877", "scene": "insurer app"},
    {"object_type": "medicine_label", "use": "inhaler box during a dust-allergy week", "text": "BREATHE-EZ inhaler\n2 puffs as needed", "scene": "box on desk"},
    {"object_type": "boarding_pass", "use": "bus ticket overnight trip", "text": "RED BUS\nBLR-GOA\nSeat 18  21:00", "scene": "ticket screenshot"},
    {"object_type": "document_screenshot", "use": "meeting Zoom ID saved as a screenshot", "text": "Zoom 874 221 0091\nPasscode 4419", "scene": "calendar screenshot"},
    {"object_type": "other", "use": "serial number inside a laptop lid", "text": "S/N C02XG123N", "scene": "laptop underside"},
    {"object_type": "receipt", "use": "amazon refund screenshot when a package was wrong", "text": "Refund initiated\nOrder 407-112233", "scene": "app screenshot"},
    {"object_type": "id_card", "use": "apartment access card photo sent to security", "text": "OAKWOOD\nFlat 12-04\nVisitor escort", "scene": "access card"},
    # College topic mix (Ritu): memories + certificates share "college"
    {"object_type": "college_memory", "use": "college fest with friends on the lawn", "text": "CULT FEST\nCampus night\nFriends on the lawn", "scene": "camera photo of friends at college fest"},
    {"object_type": "college_memory", "use": "last day of college on the main steps", "text": "Final year\nMain block steps\nClass of 2019", "scene": "camera photo of classmates on college steps"},
    {"object_type": "college_memory", "use": "hostel room last semester", "text": "Hostel B-214\nLast semester", "scene": "camera photo of a college hostel room"},
    {"object_type": "certificate", "use": "degree certificate saved for job applications", "text": "DEGREE CERTIFICATE\nBachelor of Technology\nComputer Science", "scene": "scanned college degree certificate"},
    {"object_type": "certificate", "use": "college merit certificate for a resume", "text": "CERTIFICATE OF MERIT\nTechnical symposium\nFirst prize", "scene": "photographed paper certificate from college"},
    {"object_type": "certificate", "use": "marksheet photographed for a form", "text": "SEMESTER GRADE CARD\nCGPA 8.4\nCollege of Engineering", "scene": "document photo of a college marksheet"},
]


def _font(size: int):
    for name in ("arial.ttf", "segoeui.ttf", "calibri.ttf", "DejaVuSans.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def paint(spec: dict, path: Path, idx: int) -> None:
    w, h = 720, 540
    bg = [(40, 48, 62), (62, 44, 40), (36, 58, 52), (48, 48, 58)][idx % 4]
    img = Image.new("RGB", (w, h), bg)
    draw = ImageDraw.Draw(img)
    draw.rectangle([30, 30, w - 30, h - 30], fill=(245, 241, 232), outline=(20, 20, 20), width=3)
    draw.text((50, 50), spec["object_type"].replace("_", " ").upper(), font=_font(22), fill=(30, 30, 30))
    draw.text((50, 120), spec["text"], font=_font(28), fill=(20, 20, 20))
    img.save(path, "PNG")
    # OCR stand-in in PNG metadata — indexer reads this, agent never sees library extras
    from PIL.PngImagePlugin import PngInfo

    meta = PngInfo()
    meta.add_text("object_type", spec["object_type"])
    meta.add_text("visible_text_summary", spec["text"].replace("\n", " | "))
    meta.add_text("likely_context_of_use", spec["use"])
    meta.add_text("scene_cues", spec["scene"])
    img.save(path, "PNG", pnginfo=meta)


def main() -> None:
    rng = random.Random(7)
    config.MVP_IMAGES.mkdir(parents=True, exist_ok=True)
    library = []
    years = [2022, 2023, 2024, 2025]
    months = [1, 2, 3, 6, 8, 11]
    for i, spec in enumerate(SPECS):
        fname = f"IMG_{years[i % 4]}{months[i % 6]:02d}{1000 + i}.jpg"
        # store png but name like camera dump
        png_name = fname.replace(".jpg", ".png")
        path = config.MVP_IMAGES / png_name
        paint(spec, path, i)
        y, m = years[i % 4], months[i % 6]
        library.append(
            {
                "id": f"img_{i:03d}",
                "filename": png_name,
                "rough_date": f"{y}-{m:02d}",
                "file_type": (
                    "screenshot"
                    if "screenshot" in spec["scene"] or spec["object_type"] == "document_screenshot"
                    else "photo"
                ),
            }
        )
        rng.random()
    config.MVP_LIBRARY.write_text(json.dumps(library, indent=2), encoding="utf-8")
    print(f"{len(library)} images + sparse library.json")


if __name__ == "__main__":
    main()
