"use client";

import { useState } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { PDFPage, PDFFont, Color } from "pdf-lib";
import dynamic from "next/dynamic";
import { useRef } from "react";

// Dynamically import SignaturePad to avoid SSR issues (move outside component)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SignaturePad = dynamic<any>(() => import("react-signature-canvas"), { ssr: false });

export default function Home() {
  const [form, setForm] = useState({
    studentName: "",
    studentNumber: "",
    studentDOB: "",
    studentRoom: "",
    studentEmail: "",
    studentSignature: "",
    parentName: "",
    parentContact: "",
    parentAltContact: "",
    parentAddress: "",
    parentRelation: "",
    altEmergencyName: "",
    altEmergencyContact: "",
    studentBuilding: "",
  });
  const [showModal, setShowModal] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sigPadRef = useRef<any>(null);

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
    // Example: Center student name at (300, 700)
    drawCenteredText(
      firstPage,
      form.studentName || "Sample Name",
      300,
      700,
      font,
      18,
      rgb(0, 0, 0)
    );
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
      14,
      rgb(0, 0, 0)
    );
    // Date
    drawCenteredText(
      page,
      getToday(),
      450,
      370,
      font,
      14,
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
      14,
      rgb(0, 0, 0)
    );
    // Date
    drawCenteredText(
      page,
      getToday(),
      450,
      197,
      font,
      14,
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
      14,
      rgb(0, 0, 0)
    );
    // Date
    drawCenteredText(
      page,
      getToday(),
      471,
      98,
      font,
      14,
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
            <div>
              <label className="block font-medium mb-1 text-gray-900" htmlFor="studentEmail">Email Address</label>
              <input
                type="email"
                id="studentEmail"
                name="studentEmail"
                value={form.studentEmail}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            {/* Remove submission date field from the form UI */}
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
