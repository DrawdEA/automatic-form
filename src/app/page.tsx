"use client";

import { useState } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { PDFPage, PDFFont, Color } from "pdf-lib";
import dynamic from "next/dynamic";
import { useRef } from "react";

// Dynamically import SignaturePad to avoid SSR issues (move outside component)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SignaturePad = dynamic<any>(() => import("react-signature-canvas"), { ssr: false });

type FormState = {
  studentName: string;
  studentNumber: string;
  studentDOB: string;
  studentBuilding: string;
  studentRoom: string;
  studentSignature: string;
  parentName: string;
  parentContact: string;
  parentAltContact: string;
  parentAddress: string;
  parentRelation: string;
  altEmergencyName: string;
  altEmergencyContact: string;
  parentEmail: string;
  appliances: string[];
  otherAppliances: string;
};

// Utility for appliance box styling
const applianceBoxClass = (selected: boolean) =>
  `cursor-pointer rounded border p-3 flex flex-col gap-1 items-start transition-all ${selected ? 'border-blue-600 bg-blue-50 shadow' : 'border-gray-300 bg-white hover:border-blue-400'}`;

export default function Home() {
  const [form, setForm] = useState<FormState>({
    studentName: "",
    studentNumber: "",
    studentDOB: "",
    studentBuilding: "",
    studentRoom: "",
    studentSignature: "",
    parentName: "",
    parentContact: "",
    parentAltContact: "",
    parentAddress: "",
    parentRelation: "",
    altEmergencyName: "",
    altEmergencyContact: "",
    parentEmail: "",
    appliances: [], // array of selected appliance keys
    otherAppliances: "", // free text input
  });
  const [showModal, setShowModal] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sigPadRef = useRef<any>(null);
  const [otherApplianceCost, setOtherApplianceCost] = useState<string>("");
  // Calculate total fee
  const applianceFeeMap: Record<string, number> = {
    hairDryer: 600,
    hairIron: 600,
    clothesSteamer: 600,
    airPurifier: 800,
    dehumidifier: 800,
    handheldVacuum: 800,
    deskFan: 800,
    rechargeableFan: 400,
    airCooler: 1200,
    kettle: 600,
    riceCooker: 600,
    coffeeMaker: 600,
    blender: 600,
    sandwichMaker: 600,
    airFryer: 800,
    refrigerator: 1800,
    escooter: 1200,
    smartHome: 1200,
    projector: 1200,
    extraLaptop: 2000,
  };
  const totalApplianceFee = form.appliances.reduce((sum, key) => sum + (applianceFeeMap[key] || 0), 0) + (otherApplianceCost ? Number(otherApplianceCost) || 0 : 0);

  const clearSignature = () => {
    sigPadRef.current?.clear();
    setSignatureData(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Helper to get today's date in YYYY-MM-DD format
  const getToday = () => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  };

  // Helper to draw horizontally centered text, bottom-aligned vertically
  const drawCenteredText = (
    page: PDFPage,
    text: string,
    centerX: number,
    baseY: number,
    font: PDFFont,
    fontSize: number,
    color: Color
  ) => {
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const x = centerX - textWidth / 2;
    const y = baseY; // y is now the bottom of the text
    page.drawText(text, { x, y, size: fontSize, font, color });
  };

  // Example: Download filled Appliance Declaration Form
  const downloadApplianceDeclaration = async () => {
    const url = "/forms/1. URH Appliance Declaration Form (Intersession).pdf";
    const existingPdfBytes = await fetch(url).then((res) => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    // Helper for y conversion
    const y = (v: number) => 791 - v;
    // Name (left-anchored)
    firstPage.drawText(form.studentName || "", { x: 90, y: y(63), size: 12, font, color: rgb(0, 0, 0) });
    // Student ID (left-anchored)
    firstPage.drawText(form.studentNumber || "", { x: 338, y: y(63), size: 12, font, color: rgb(0, 0, 0) });
    // Building + Room (left-anchored)
    firstPage.drawText(`${form.studentBuilding} ${form.studentRoom}`.trim(), { x: 495, y: y(63), size: 12, font, color: rgb(0, 0, 0) });
    // Email (left-anchored)
    firstPage.drawText(form.parentEmail || "", { x: 127, y: y(86), size: 12, font, color: rgb(0, 0, 0) });
    // Submission date (left-anchored, y set to 86)
    firstPage.drawText(getToday(), { x: 460, y: y(86), size: 12, font, color: rgb(0, 0, 0) });
    // Signature (centered over printed name, y reduced by 7)
    if (signatureData) {
      const signatureImage = await pdfDoc.embedPng(signatureData);
      firstPage.drawImage(signatureImage, {
        x: 310 - 60, // center at 310, width 120
        y: y(750) - 7,
        width: 120,
        height: 40,
      });
    }
    // Printed name under signature (centered, y increased by 7 again)
    drawCenteredText(firstPage, form.studentName || "", 310, y(750) - 11 + 7, font, 12, rgb(0, 0, 0));
    // Other appliances (anchored left)
    if (form.otherAppliances) {
      firstPage.drawText(form.otherAppliances, { x: 60, y: y(647), size: 12, font, color: rgb(0, 0, 0) });
    }
    // Total paid (centered)
    drawCenteredText(firstPage, totalApplianceFee.toLocaleString(), 262, y(676), font, 12, rgb(0, 0, 0));
    // Free-charge item checkmarks (centered)
    const freeChargeChecks = [
      { key: "laptop", x: 125, y: 389 },
      { key: "printer", x: 239, y: 389 },
      { key: "tablet", x: 322, y: 389 },
      { key: "studyLamp", x: 404, y: 389 },
    ];
    freeChargeChecks.forEach(item => {
      if (form.appliances.includes(item.key)) {
        drawCenteredText(firstPage, "/", item.x, y(item.y), font, 11, rgb(0, 0, 0));
      }
    });
    // Personal Convenience & Comfort checkmarks
    const comfortKeys = [
      "hairDryer",
      "hairIron",
      "clothesSteamer",
      "airPurifier",
      "dehumidifier",
      "handheldVacuum",
      "deskFan",
      "rechargeableFan",
      "airCooler",
    ];
    const comfortYs = [449, 461, 473, 485, 503, 521, 543, 571, 591];
    comfortKeys.forEach((key, i) => {
      if (form.appliances.includes(key)) {
        drawCenteredText(firstPage, "/", 262, y(comfortYs[i]), font, 11, rgb(0, 0, 0));
      }
    });
    // Food and Beverage Appliances checkmarks
    const foodKeys = [
      "kettle",
      "riceCooker",
      "coffeeMaker",
      "blender",
      "sandwichMaker",
      "airFryer",
      "refrigerator",
    ];
    const foodYs = [462, 474, 487, 498, 510, 522, 539];
    foodKeys.forEach((key, i) => {
      if (form.appliances.includes(key)) {
        drawCenteredText(firstPage, "/", 522, y(foodYs[i]), font, 11, rgb(0, 0, 0));
      }
    });
    // Tech & Entertainment Appliances checkmarks
    const techKeys = [
      "escooter",
      "smartHome",
      "projector",
      "extraLaptop",
    ];
    const techYs = [607, 625, 642, 672];
    techKeys.forEach((key, i) => {
      if (form.appliances.includes(key)) {
        drawCenteredText(firstPage, "/", 522, y(techYs[i]), font, 11, rgb(0, 0, 0));
      }
    });
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `ADF_${form.studentNumber || "1234"}_${form.studentName || "Sample"}.pdf`;
    link.click();
  };

  // Download filled URH Residency Terms & Conditions (page 3)
  const downloadTermsAndConditions = async () => {
    const url = "/forms/7. URH Residency TERMS & CONDITIONS.pdf";
    const existingPdfBytes = await fetch(url).then((res) => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const page = pages[2]; // 3rd page (0-indexed)
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    // Draw signature image above the printed name if available
    if (signatureData) {
      const signatureImage = await pdfDoc.embedPng(signatureData);
      page.drawImage(signatureImage, {
        x: 140, // center at 200 with width 120
        y: 370,
        width: 120,
        height: 40,
      });
    }
    // Printed name and student number (below the line)
    drawCenteredText(
      page,
      `${form.studentName} (${form.studentNumber})`,
      200,
      370,
      font,
      12,
      rgb(0, 0, 0)
    );
    // Date
    drawCenteredText(
      page,
      getToday(),
      450,
      370,
      font,
      12,
      rgb(0, 0, 0)
    );
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `URH_TERMS_${form.studentNumber || "1234"}_${form.studentName || "Sample"}.pdf`;
    link.click();
  };

  // Download filled Residency Agreement - Intersession (page 3)
  const downloadResidencyAgreement = async () => {
    const url = "/forms/8. Residency Agreement - Intersession.pdf";
    const existingPdfBytes = await fetch(url).then((res) => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const page = pages[1]; // 2nd page (0-indexed)
    if (!page) {
      alert("The Residency Agreement PDF does not have a second page.");
      return;
    }
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    // Draw signature image above the printed name if available
    if (signatureData) {
      const signatureImage = await pdfDoc.embedPng(signatureData);
      page.drawImage(signatureImage, {
        x: 140, // center at 200 with width 120
        y: 197,
        width: 120,
        height: 40,
      });
    }
    // Printed name and student number (below the line)
    drawCenteredText(
      page,
      `${form.studentName} (${form.studentNumber})`,
      200,
      197,
      font,
      12,
      rgb(0, 0, 0)
    );
    // Date
    drawCenteredText(
      page,
      getToday(),
      450,
      197,
      font,
      12,
      rgb(0, 0, 0)
    );
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Residency_Agreement_${form.studentNumber || "1234"}_${form.studentName || "Sample"}.pdf`;
    link.click();
  };

  // Download filled URH Data Privacy Policy (single page, with checks)
  const downloadDataPrivacyPolicy = async () => {
    const url = "/forms/9. URH Data Privacy Policy.pdf";
    const existingPdfBytes = await fetch(url).then((res) => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const page = pages[0]; // single page
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    // Draw signature image above the printed name if available
    if (signatureData) {
      const signatureImage = await pdfDoc.embedPng(signatureData);
      page.drawImage(signatureImage, {
        x: 151, // center at 211 with width 120
        y: 98,
        width: 120,
        height: 40,
      });
    }
    // Printed name and student number
    drawCenteredText(
      page,
      `${form.studentName} (${form.studentNumber})`,
      211,
      98,
      font,
      12,
      rgb(0, 0, 0)
    );
    // Date
    drawCenteredText(
      page,
      getToday(),
      471,
      98,
      font,
      12,
      rgb(0, 0, 0)
    );
    // Draw check marks
    // The second check mark's y value is 195
    page.drawText("/", { x: 95, y: 235, size: 18, font, color: rgb(0, 0, 0) });
    page.drawText("/", { x: 95, y: 198, size: 18, font, color: rgb(0, 0, 0) });
    page.drawText("/", { x: 95, y: 145, size: 18, font, color: rgb(0, 0, 0) });
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Data_Privacy_Policy_${form.studentNumber || "1234"}_${form.studentName || "Sample"}.pdf`;
    link.click();
  };

  // Download filled Consent Form (single page, custom fields)
  const downloadConsentForm = async () => {
    const url = "/forms/10. Consent Form.pdf";
    const existingPdfBytes = await fetch(url).then((res) => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const page = pages[0]; // single page
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    // Parent name
    drawCenteredText(page, form.parentName, 263, 640, font, 12, rgb(0, 0, 0));
    // Student name
    drawCenteredText(page, form.studentName, 420, 617, font, 12, rgb(0, 0, 0));
    // Date of birth
    drawCenteredText(page, form.studentDOB, 218, 599, font, 12, rgb(0, 0, 0));
    // Building (y + 2)
    drawCenteredText(page, form.studentBuilding, 338, 582, font, 12, rgb(0, 0, 0));
    // Parent contact number (y + 3)
    drawCenteredText(page, form.parentContact, 275, 442, font, 12, rgb(0, 0, 0));
    // Alt contact number (y + 3)
    drawCenteredText(page, form.parentAltContact, 475, 442, font, 12, rgb(0, 0, 0));
    // Parent email
    page.drawText(form.parentEmail || "", { x: 187, y: 418, size: 12, font, color: rgb(0, 0, 0) });
    // Relation (y + 3)
    drawCenteredText(page, form.parentRelation, 242, 397, font, 12, rgb(0, 0, 0));
    // Alt emergency person name (y + 1)
    page.drawText(form.altEmergencyName || "", { x: 143, y: 349, size: 12, font, color: rgb(0, 0, 0) });
    // Alt emergency person contact (y + 1)
    drawCenteredText(page, form.altEmergencyContact, 451, 349, font, 12, rgb(0, 0, 0));
    // Signature image
    if (signatureData) {
      const signatureImage = await pdfDoc.embedPng(signatureData);
      page.drawImage(signatureImage, {
        x: 182, // center at 242 with width 120
        y: 81,
        width: 120,
        height: 40,
      });
    }
    // Printed name (no student id)
    drawCenteredText(page, form.studentName, 242, 81, font, 12, rgb(0, 0, 0));
    // Date
    drawCenteredText(page, getToday(), 439, 81, font, 12, rgb(0, 0, 0));
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Consent_Form_${form.studentNumber || "1234"}_${form.studentName || "Sample"}.pdf`;
    link.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowModal(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-6">URH Residency Form Automation</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-4xl space-y-8 bg-white p-6 rounded shadow text-gray-900">
        {/* Your Info Section */}
        <div>
          <h2 className="text-lg font-bold mb-4 col-span-3">Your Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium mb-1 text-gray-900" htmlFor="studentName">Name</label>
              <input
                type="text"
                id="studentName"
                name="studentName"
                value={form.studentName}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block font-medium mb-1 text-gray-900" htmlFor="studentNumber">Student No.</label>
              <input
                type="text"
                id="studentNumber"
                name="studentNumber"
                value={form.studentNumber}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block font-medium mb-1 text-gray-900" htmlFor="studentDOB">Date of Birth</label>
              <input
                type="date"
                id="studentDOB"
                name="studentDOB"
                value={form.studentDOB}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block font-medium mb-1 text-gray-900" htmlFor="studentBuilding">Building</label>
              <select
                id="studentBuilding"
                name="studentBuilding"
                value={form.studentBuilding || ""}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="" disabled>Select a building</option>
                <option value="Cervini Hall">Cervini Hall</option>
                <option value="Eliazo Hall">Eliazo Hall</option>
                <option value="University Dorm North">University Dorm North</option>
                <option value="University Dorm South">University Dorm South</option>
                <option value="International Residence Hall">International Residence Hall</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1 text-gray-900" htmlFor="studentRoom">Room</label>
              <input
                type="text"
                id="studentRoom"
                name="studentRoom"
                value={form.studentRoom}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            {/* Remove student email field from the form UI */}
            <div className="col-span-3">
              <label className="block font-medium mb-1 text-gray-900">Signature</label>
              <div className="bg-gray-100 border rounded p-2 flex flex-col items-center">
                <SignaturePad
                  ref={sigPadRef}
                  penColor="black"
                  canvasProps={{ width: 400, height: 120, className: "rounded bg-white border" }}
                  onEnd={() => setSignatureData(sigPadRef.current?.isEmpty() ? null : sigPadRef.current?.toDataURL())}
                />
                <div className="flex gap-2 mt-2">
                  <button type="button" onClick={clearSignature} className="px-3 py-1 bg-gray-400 text-white rounded">Clear</button>
                </div>
                {!signatureData && <span className="text-xs text-red-500 mt-1">Please provide your signature above.</span>}
              </div>
            </div>
          </div>
        </div>
        {/* Parent Info Section */}
        <div>
          <h2 className="text-lg font-bold mb-4 col-span-3">Parent Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium mb-1 text-gray-900" htmlFor="parentName">Name</label>
              <input
                type="text"
                id="parentName"
                name="parentName"
                value={form.parentName}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block font-medium mb-1 text-gray-900" htmlFor="parentContact">Contact No.</label>
              <input
                type="text"
                id="parentContact"
                name="parentContact"
                value={form.parentContact}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block font-medium mb-1 text-gray-900" htmlFor="parentAltContact">Alternative Contact No.</label>
              <input
                type="text"
                id="parentAltContact"
                name="parentAltContact"
                value={form.parentAltContact}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block font-medium mb-1 text-gray-900" htmlFor="parentAddress">Address</label>
              <input
                type="text"
                id="parentAddress"
                name="parentAddress"
                value={form.parentAddress}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block font-medium mb-1 text-gray-900" htmlFor="parentRelation">Relation</label>
              <input
                type="text"
                id="parentRelation"
                name="parentRelation"
                value={form.parentRelation}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block font-medium mb-1 text-gray-900" htmlFor="parentEmail">Email Address</label>
              <input
                type="email"
                id="parentEmail"
                name="parentEmail"
                value={form.parentEmail || ""}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
          </div>
        </div>
        {/* Alternate Emergency Person Section (moved to last) */}
        <div>
          <h2 className="text-lg font-bold mb-4 col-span-3">Alternate Emergency Person</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1 text-gray-900" htmlFor="altEmergencyName">Name</label>
              <input
                type="text"
                id="altEmergencyName"
                name="altEmergencyName"
                value={form.altEmergencyName}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block font-medium mb-1 text-gray-900" htmlFor="altEmergencyContact">Contact No.</label>
              <input
                type="text"
                id="altEmergencyContact"
                name="altEmergencyContact"
                value={form.altEmergencyContact}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
          </div>
        </div>
        {/* Appliance Selection Section */}
        <div>
          <h2 className="text-lg font-bold mb-4 col-span-3">Appliance Declaration</h2>
          <div className="mb-2 font-semibold">Free-Charge Items</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {[
              { key: "laptop", label: "Laptop or Desktop" },
              { key: "printer", label: "Printer" },
              { key: "tablet", label: "Tablet" },
              { key: "studyLamp", label: "Study Lamp" },
            ].map(item => {
              const selected = form.appliances.includes(item.key);
              return (
                <div
                  key={item.key}
                  className={applianceBoxClass(selected)}
                  onClick={() => {
                    setForm(f => ({
                      ...f,
                      appliances: selected
                        ? f.appliances.filter(k => k !== item.key)
                        : [...f.appliances, item.key],
                    }));
                  }}
                  tabIndex={0}
                  role="button"
                  aria-pressed={selected}
                  onKeyDown={e => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      setForm(f => ({
                        ...f,
                        appliances: selected
                          ? f.appliances.filter(k => k !== item.key)
                          : [...f.appliances, item.key],
                      }));
                    }
                  }}
                >
                  <span className="font-medium">{item.label}</span>
                </div>
              );
            })}
          </div>
          <div className="mb-2 font-semibold">Personal Convenience & Comfort</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
            {[
              { key: "hairDryer", label: "Hair Dryer", fee: 600 },
              { key: "hairIron", label: "Hair Iron", fee: 600 },
              { key: "clothesSteamer", label: "Clothes Steamer", fee: 600 },
              { key: "airPurifier", label: "Air Purifier", fee: 800 },
              { key: "dehumidifier", label: "Dehumidifier (max 60W)", fee: 800 },
              { key: "handheldVacuum", label: "Handheld Vacuum", fee: 800 },
              { key: "deskFan", label: "Conventional Elec Fan (Desk/Stand Fan 30W-60W max)", fee: 800 },
              { key: "rechargeableFan", label: "Rechargeable Elec Fan (6W-29W)", fee: 400 },
              { key: "airCooler", label: "Air Cooler", fee: 1200 },
            ].map(item => {
              const selected = form.appliances.includes(item.key);
              return (
                <div
                  key={item.key}
                  className={applianceBoxClass(selected)}
                  onClick={() => {
                    setForm(f => ({
                      ...f,
                      appliances: selected
                        ? f.appliances.filter(k => k !== item.key)
                        : [...f.appliances, item.key],
                    }));
                  }}
                  tabIndex={0}
                  role="button"
                  aria-pressed={selected}
                  onKeyDown={e => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      setForm(f => ({
                        ...f,
                        appliances: selected
                          ? f.appliances.filter(k => k !== item.key)
                          : [...f.appliances, item.key],
                      }));
                    }
                  }}
                >
                  <span className="font-medium">{item.label}</span>
                  <span className="text-xs text-gray-500">({item.fee})</span>
                </div>
              );
            })}
          </div>
          <div className="mb-2 font-semibold">Food and Beverage Appliances</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
            {[
              { key: "kettle", label: "Electric Kettle", fee: 600 },
              { key: "riceCooker", label: "Rice Cooker", fee: 600 },
              { key: "coffeeMaker", label: "Coffee Maker", fee: 600 },
              { key: "blender", label: "Portable Blender", fee: 600 },
              { key: "sandwichMaker", label: "Sandwich Maker", fee: 600 },
              { key: "airFryer", label: "Air Fryer", fee: 800 },
              { key: "refrigerator", label: "Refrigerator (max 5 cu.ft; 1 ref/room)", fee: 1800 },
            ].map(item => {
              const selected = form.appliances.includes(item.key);
              return (
                <div
                  key={item.key}
                  className={applianceBoxClass(selected)}
                  onClick={() => {
                    setForm(f => ({
                      ...f,
                      appliances: selected
                        ? f.appliances.filter(k => k !== item.key)
                        : [...f.appliances, item.key],
                    }));
                  }}
                  tabIndex={0}
                  role="button"
                  aria-pressed={selected}
                  onKeyDown={e => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      setForm(f => ({
                        ...f,
                        appliances: selected
                          ? f.appliances.filter(k => k !== item.key)
                          : [...f.appliances, item.key],
                      }));
                    }
                  }}
                >
                  <span className="font-medium">{item.label}</span>
                  <span className="text-xs text-gray-500">({item.fee})</span>
                </div>
              );
            })}
          </div>
          <div className="mb-2 font-semibold">Tech & Entertainment Appliances</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
            {[
              { key: "escooter", label: "E-bike or E-Scooter", fee: 1200 },
              { key: "smartHome", label: "Smart Home Devices (speaker, etc.)", fee: 1200 },
              { key: "projector", label: "Portable Projector", fee: 1200 },
              { key: "extraLaptop", label: "Additional laptop/desktop, monitors, non-handheld gaming console, etc.", fee: 2000 },
            ].map(item => {
              const selected = form.appliances.includes(item.key);
              return (
                <div
                  key={item.key}
                  className={applianceBoxClass(selected)}
                  onClick={() => {
                    setForm(f => ({
                      ...f,
                      appliances: selected
                        ? f.appliances.filter(k => k !== item.key)
                        : [...f.appliances, item.key],
                    }));
                  }}
                  tabIndex={0}
                  role="button"
                  aria-pressed={selected}
                  onKeyDown={e => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      setForm(f => ({
                        ...f,
                        appliances: selected
                          ? f.appliances.filter(k => k !== item.key)
                          : [...f.appliances, item.key],
                      }));
                    }
                  }}
                >
                  <span className="font-medium">{item.label}</span>
                  <span className="text-xs text-gray-500">({item.fee})</span>
                </div>
              );
            })}
          </div>
          <div className="mb-2 font-semibold">Other Appliances</div>
          <input
            type="text"
            name="otherAppliances"
            value={form.otherAppliances}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 mb-2"
            placeholder="Please declare other items not listed above"
          />
          <input
            type="number"
            min="0"
            step="any"
            value={otherApplianceCost}
            onChange={e => setOtherApplianceCost(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-2"
            placeholder="Optional: Cost for other appliances (if applicable)"
          />
          <div className="mt-4 text-lg font-bold text-right">
            Total Amount to be Paid: <span className="text-red-600">{totalApplianceFee.toLocaleString()}</span>
          </div>
        </div>
        {/* Choice of Appliance will be added later */}
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition mt-4">Submit</button>
      </form>
      {/* Modal Popup for Downloads */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-70 backdrop-blur-sm z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
            <h2 className="text-xl font-bold mb-4">Download Your Filled Forms</h2>
            <button
              type="button"
              onClick={downloadApplianceDeclaration}
              className="w-full bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700 transition mb-4"
            >
              Download Appliance Declaration Form
            </button>
            <button
              type="button"
              onClick={downloadTermsAndConditions}
              className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition mb-4"
            >
              Download URH Residency Terms & Conditions
            </button>
            <button
              type="button"
              onClick={downloadResidencyAgreement}
              className="w-full bg-purple-600 text-white py-2 rounded font-semibold hover:bg-purple-700 transition mb-4"
            >
              Download Residency Agreement - Intersession
            </button>
            <button
              type="button"
              onClick={downloadDataPrivacyPolicy}
              className="w-full bg-pink-600 text-white py-2 rounded font-semibold hover:bg-pink-700 transition mb-4"
            >
              Download Data Privacy Policy
            </button>
            <button
              type="button"
              onClick={downloadConsentForm}
              className="w-full bg-orange-600 text-white py-2 rounded font-semibold hover:bg-orange-700 transition mb-4"
            >
              Download Consent Form
            </button>
            {/* Add more download buttons for other PDFs here */}
            <button
              onClick={() => setShowModal(false)}
              className="w-full bg-gray-400 text-white py-2 rounded font-semibold hover:bg-gray-500 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
