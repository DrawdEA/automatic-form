"use client";

import { useState } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export default function Home() {
  const [form, setForm] = useState({
    studentName: "",
    studentNumber: "",
    studentDOB: "",
    studentRoom: "",
    studentEmail: "",
    submissionDate: "",
    studentSignature: "",
    parentName: "",
    parentContact: "",
    parentAltContact: "",
    parentAddress: "",
    parentRelation: "",
    altEmergencyName: "",
    altEmergencyContact: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Handle PDF generation and download
    alert("Form submitted! (PDF generation not yet implemented)");
  };

  // Helper to fetch and modify PDF
  const fillSamplePdf = async () => {
    // Fetch the PDF from public/forms
    const url = "/forms/1. URH Appliance Declaration Form (Intersession).pdf";
    const existingPdfBytes = await fetch(url).then((res) => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // Draw the student name at a test position (x=100, y=700)
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    firstPage.drawText(form.studentName || "Sample Name", {
      x: 100,
      y: 700,
      size: 18,
      font,
      color: rgb(0, 0, 0),
    });

    // Download the modified PDF
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `ADF_${form.studentNumber || "1234"}_${form.studentName || "Sample"}.pdf`;
    link.click();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-6">URH Residency Form Automation</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 bg-white p-6 rounded shadow text-gray-900">
        <div>
          <label className="block font-medium mb-1 text-gray-900" htmlFor="studentName">Student Name</label>
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
          <label className="block font-medium mb-1 text-gray-900" htmlFor="studentDOB">Student Date of Birth</label>
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
          <label className="block font-medium mb-1 text-gray-900" htmlFor="studentRoom">BLDG & ROOM</label>
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
          <label className="block font-medium mb-1 text-gray-900" htmlFor="studentEmail">Student Email Address</label>
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
        <div>
          <label className="block font-medium mb-1 text-gray-900" htmlFor="submissionDate">Submission Date</label>
          <input
            type="date"
            id="submissionDate"
            name="submissionDate"
            value={form.submissionDate}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1 text-gray-900" htmlFor="studentSignature">Student Signature</label>
          <input
            type="text"
            id="studentSignature"
            name="studentSignature"
            value={form.studentSignature}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <hr />
        <div>
          <label className="block font-medium mb-1 text-gray-900" htmlFor="parentName">Parent&apos;s Name</label>
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
          <label className="block font-medium mb-1 text-gray-900" htmlFor="parentContact">Parent&apos;s Contact No.</label>
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
          <label className="block font-medium mb-1 text-gray-900" htmlFor="parentAltContact">Parent&apos;s Alternative Contact No.</label>
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
          <label className="block font-medium mb-1 text-gray-900" htmlFor="parentAddress">Parent&apos;s Address</label>
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
          <label className="block font-medium mb-1 text-gray-900" htmlFor="parentRelation">Relation to Student</label>
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
        <hr />
        <div>
          <label className="block font-medium mb-1 text-gray-900" htmlFor="altEmergencyName">Alternate Emergency Person Name</label>
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
          <label className="block font-medium mb-1 text-gray-900" htmlFor="altEmergencyContact">Alternate Emergency Person Contact No.</label>
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
        {/* Choice of Appliance will be added later */}
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition">Submit</button>
        <button
          type="button"
          className="w-full bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700 transition mt-2"
          onClick={fillSamplePdf}
        >
          Test PDF Download
        </button>
      </form>
    </div>
  );
}
