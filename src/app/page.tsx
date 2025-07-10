"use client";

import { useState, useEffect } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { PDFPage, PDFFont, Color } from "pdf-lib";
import dynamic from "next/dynamic";
import { useRef } from "react";
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-var-requires
// pdfjsLib dynamic import will be handled inside the Home component
import "pdfjs-dist/legacy/web/pdf_viewer.css";
import Head from "next/head";
import { useState as useReactState } from "react";

// Dynamically import SignaturePad to avoid SSR issues (move outside component)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SignaturePad = dynamic<any>(() => import("react-signature-canvas"), { ssr: false });

type FormState = {
  studentFirstName: string;
  studentLastName: string;
  studentNumber: string;
  studentDOB: string;
  studentBuilding: string;
  studentRoom: string;
  studentSignature: string;
  studentEmail: string; // <--- Re-added
  parentFirstName: string;
  parentLastName: string;
  parentContact: string;
  parentAltContact: string;
  parentAddress: string;
  parentRelation: string;
  altEmergencyFirstName: string;
  altEmergencyLastName: string;
  altEmergencyContact: string;
  parentEmail: string;
  appliances: string[];
  otherAppliances: string;
};

// Utility for appliance box styling
const applianceBoxClass = (selected: boolean, darkMode = false) =>
  `cursor-pointer rounded border p-3 flex flex-col gap-1 items-start transition-all ` +
  (selected
    ? (darkMode ? 'border-blue-400 bg-blue-950 shadow' : 'border-blue-600 bg-blue-50 shadow')
    : (darkMode ? 'border-gray-700 bg-gray-800 hover:border-blue-400' : 'border-gray-300 bg-white hover:border-blue-400'));

export default function Home() {
  // pdfjsLib ref for client-side PDF.js usage
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfjsLibRef = useRef<any>(null);
  useEffect(() => {
    let isMounted = true;
    if (typeof window !== "undefined" && !pdfjsLibRef.current) {
      // @ts-expect-error: pdfjs-dist/legacy/build/pdf has no types
      import("pdfjs-dist/legacy/build/pdf").then((mod) => {
        if (isMounted) {
          pdfjsLibRef.current = mod;
          pdfjsLibRef.current.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLibRef.current.version}/pdf.worker.min.js`;
        }
      });
    }
    return () => { isMounted = false; };
  }, []);
  const [form, setForm] = useState<FormState>({
    studentFirstName: "",
    studentLastName: "",
    studentNumber: "",
    studentDOB: "",
    studentBuilding: "",
    studentRoom: "",
    studentSignature: "",
    studentEmail: "", // <--- Re-added
    parentFirstName: "",
    parentLastName: "",
    parentContact: "",
    parentAltContact: "",
    parentAddress: "",
    parentRelation: "",
    altEmergencyFirstName: "",
    altEmergencyLastName: "",
    altEmergencyContact: "",
    parentEmail: "",
    appliances: [], // array of selected appliance keys
    otherAppliances: "", // free text input
  });
  // Restore utility functions
  const getStudentFullName = () => `${form.studentLastName}, ${form.studentFirstName}`;
  const getStudentFullNameDisplay = () => `${form.studentFirstName} ${form.studentLastName}`;
  const getParentFullNameDisplay = () => `${form.parentFirstName} ${form.parentLastName}`;
  const getAltEmergencyFullNameDisplay = () => `${form.altEmergencyFirstName} ${form.altEmergencyLastName}`;
  const getToday = () => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  };
  const [showModal, setShowModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  // const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  // const [previewBlobs, setPreviewBlobs] = useState<Blob[]>([]);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sigPadRef = useRef<any>(null);
  const [otherApplianceCost, setOtherApplianceCost] = useState<string>("");
  const [sigPadWidth, setSigPadWidth] = useState(400);
  const sigPadContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const updateWidth = () => {
      if (sigPadContainerRef.current) {
        setSigPadWidth(Math.min(400, sigPadContainerRef.current.offsetWidth));
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);
  // Calculate total fee
  const applianceFeeMap: Record<string, number> = {
    hairDryer: 1500,
    hairIron: 1500,
    clothesSteamer: 1500,
    airPurifier: 2000,
    dehumidifier: 2000,
    handheldVacuum: 2000,
    deskFan: 2000,
    rechargeableFan: 1000,
    airCooler: 3000,
    kettle: 1500,
    riceCooker: 1500,
    coffeeMaker: 1500,
    blender: 1500,
    sandwichMaker: 1500,
    airFryer: 2000,
    refrigerator: 4500,
    escooter: 3000,
    smartHome: 3000,
    projector: 3000,
    extraLaptop: 5000,
  };
  const totalApplianceFee = form.appliances.reduce((sum, key) => sum + (applianceFeeMap[key] || 0), 0) + (otherApplianceCost ? Number(otherApplianceCost) || 0 : 0);

  // Helper to abbreviate building for ADF form
  const getBuildingAbbreviation = () => {
    switch (form.studentBuilding) {
      case "Cervini Hall": return "C";
      case "Eliazo Hall": return "E";
      case "University Dorm North": return "UDN";
      case "University Dorm South": return "UDS";
      case "International Residence Hall": return "I";
      default: return form.studentBuilding;
    }
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
  const downloadApplianceDeclaration = async (preview = false) => {
    const url = "/forms-2025-1stsem/1. URH Appliance Declaration Form (Semestral).pdf";
    const existingPdfBytes = await fetch(url).then((res) => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    // Helper for y conversion
    const y = (v: number) => 791 - v;
    // Name (left-anchored)
    firstPage.drawText(getStudentFullNameDisplay() || "", { x: 90, y: y(63), size: 12, font, color: rgb(0, 0, 0) });
    // Student ID (left-anchored)
    firstPage.drawText(form.studentNumber || "", { x: 338, y: y(63), size: 12, font, color: rgb(0, 0, 0) });
    // Building + Room (abbreviated, left-anchored)
    firstPage.drawText(`${getBuildingAbbreviation()}${form.studentRoom}`.trim(), { x: 495, y: y(63), size: 12, font, color: rgb(0, 0, 0) });
    // Email (left-anchored)
    firstPage.drawText(form.studentEmail || "", { x: 127, y: y(86), size: 12, font, color: rgb(0, 0, 0) });
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
    drawCenteredText(firstPage, getStudentFullNameDisplay() || "", 310, y(750) - 11 + 7, font, 12, rgb(0, 0, 0));
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
    if (preview) return blob;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `ADF_${form.studentNumber || "1234"}_${getStudentFullName() || "Sample"}.pdf`;
    link.click();
  };

  // Download filled URH Residency Terms & Conditions (page 3)
  const downloadTermsAndConditions = async (preview = false) => {
    const url = "/forms-2025-1stsem/7. URH Residency TERMS & CONDITIONS (3).pdf";
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
      `${getStudentFullNameDisplay()} (${form.studentNumber})`,
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
    if (preview) return blob;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `TC_${form.studentNumber || "1234"}_${getStudentFullName() || "Sample"}.pdf`;
    link.click();
  };

  // Download filled Residency Agreement - Intersession (page 3)
  const downloadResidencyAgreement = async (preview = false) => {
    const url = "/forms-2025-1stsem/8. Residency Agreement - 1st SEM SY 25-26.pdf";
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
        y: 147,
        width: 120,
        height: 40,
      });
    }
    // Printed name and student number (below the line)
    drawCenteredText(
      page,
      `${getStudentFullNameDisplay()} (${form.studentNumber})`,
      200,
      147,
      font,
      12,
      rgb(0, 0, 0)
    );
    // Date
    drawCenteredText(
      page,
      getToday(),
      450,
      147,
      font,
      12,
      rgb(0, 0, 0)
    );
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    if (preview) return blob;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `RA_${form.studentNumber || "1234"}_${getStudentFullName() || "Sample"}.pdf`;
    link.click();
  };

  // Download filled URH Data Privacy Policy (single page, with checks)
  const downloadDataPrivacyPolicy = async (preview = false) => {
    const url = "/forms-2025-1stsem/9. URH Data Privacy Policy (3).pdf";
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
      `${getStudentFullNameDisplay()} (${form.studentNumber})`,
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
    if (preview) return blob;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `DPP_${form.studentNumber || "1234"}_${getStudentFullName() || "Sample"}.pdf`;
    link.click();
  };

  // Download filled Consent Form (single page, custom fields)
  const downloadConsentForm = async (preview = false) => {
    const url = "/forms-2025-1stsem/10. Consent Form (3).pdf";
    const existingPdfBytes = await fetch(url).then((res) => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const page = pages[0]; // single page
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    // Parent name
    drawCenteredText(page, getParentFullNameDisplay(), 263, 640, font, 12, rgb(0, 0, 0));
    // Student name
    drawCenteredText(page, getStudentFullNameDisplay(), 420, 617, font, 12, rgb(0, 0, 0));
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
    page.drawText(getAltEmergencyFullNameDisplay() || "", { x: 143, y: 349, size: 12, font, color: rgb(0, 0, 0) });
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
    drawCenteredText(page, getStudentFullNameDisplay(), 242, 81, font, 12, rgb(0, 0, 0));
    // Date
    drawCenteredText(page, getToday(), 439, 81, font, 12, rgb(0, 0, 0));
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    if (preview) return blob;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `CF_${form.studentNumber || "1234"}_${getStudentFullName() || "Sample"}.pdf`;
    link.click();
  };

  // Download all PDFs
  const downloadAll = async () => {
    await downloadApplianceDeclaration();
    await downloadTermsAndConditions();
    await downloadResidencyAgreement();
    await downloadDataPrivacyPolicy();
    await downloadConsentForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Generate all PDFs as blobs for preview
    const pdfFns = [
      downloadApplianceDeclaration,
      downloadTermsAndConditions,
      downloadResidencyAgreement,
      downloadDataPrivacyPolicy,
      downloadConsentForm,
    ];
    // setPreviewBlobs([]); // Clear previous previews
    // const blobs: Blob[] = [];
    for (const fn of pdfFns) {
      await fn(); // no preview flag
    }
    // setPreviewBlobs(blobs);
    setShowPreviewModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const clearSignature = () => {
    sigPadRef.current?.clear();
    setSignatureData(null);
  };

  const [darkMode, setDarkMode] = useReactState(false);
  return (
    <>
      <Head>
        <link href="https://fonts.googleapis.com/css?family=Roboto:400,500,700&display=swap" rel="stylesheet" />
        <style>{`
          body, input, select, button, textarea { font-family: 'Roboto', Arial, sans-serif !important; }
          .placeholder-dark::placeholder { color: #bdbdbd !important; }
        `}</style>
      </Head>
      <div className={
        `min-h-screen flex flex-col items-center justify-center p-4 pt-8 transition-colors duration-300 ` +
        (darkMode
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-blue-950'
          : 'bg-gradient-to-br from-gray-50 via-white to-blue-50')
      }>
        <button
          type="button"
          className="absolute top-4 right-4 px-4 py-2 rounded-lg font-medium shadow text-sm transition bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          onClick={() => setDarkMode(d => !d)}
        >
          {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
        <h1
          className="text-3xl font-extrabold mb-8 tracking-tight text-blue-700 transition-colors duration-300"
          style={{ fontFamily: 'Roboto, Arial, sans-serif' }}
        >
          URH Residency Form in Minutes, not Hours :)
        </h1>
        <form
          onSubmit={handleSubmit}
          className={
            `w-full max-w-4xl space-y-10 p-8 rounded-2xl shadow-2xl border backdrop-blur-md transition-colors duration-300 ` +
            (darkMode
              ? 'bg-gray-900/90 border-gray-700 text-gray-100'
              : 'bg-white/90 border-gray-100 text-gray-900')
          }
          style={{ fontFamily: 'Roboto, Arial, sans-serif' }}
        >
          {/* Your Info Section */}
          <div>
            <h2 className="text-xl font-bold mb-6 col-span-3 text-blue-600 tracking-wide">Your Info</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Student Name Fields (split) */}
              <div>
                <label className="block font-medium mb-2 text-gray-800" htmlFor="studentLastName">Last Name</label>
                <input
                  type="text"
                  id="studentLastName"
                  name="studentLastName"
                  value={form.studentLastName}
                  onChange={handleChange}
                  className={
                    `w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none placeholder:text-gray-500 ` +
                    (darkMode
                      ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-400'
                      : 'bg-white placeholder:text-gray-500')
                  }
                  placeholder="Last Name"
                  required
                />
              </div>
              <div>
                <label className="block font-medium mb-2 text-gray-800" htmlFor="studentFirstName">First Name</label>
                <input
                  type="text"
                  id="studentFirstName"
                  name="studentFirstName"
                  value={form.studentFirstName}
                  onChange={handleChange}
                  className={
                    `w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none placeholder:text-gray-500 ` +
                    (darkMode
                      ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-400'
                      : 'bg-white placeholder:text-gray-500')
                  }
                  placeholder="First Name"
                  required
                />
              </div>
              <div>
                <label className="block font-medium mb-2 text-gray-800" htmlFor="studentNumber">Student No.</label>
                <input
                  type="text"
                  id="studentNumber"
                  name="studentNumber"
                  value={form.studentNumber}
                  onChange={handleChange}
                  className={
                    `w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none placeholder:text-gray-500 ` +
                    (darkMode
                      ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-400'
                      : 'bg-white placeholder:text-gray-500')
                  }
                  placeholder="Student No."
                  required
                />
              </div>
              <div>
                <label className="block font-medium mb-2 text-gray-800" htmlFor="studentDOB">Date of Birth</label>
                <input
                  type="date"
                  id="studentDOB"
                  name="studentDOB"
                  value={form.studentDOB}
                  onChange={handleChange}
                  className={
                    `w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none placeholder:text-gray-500 ` +
                    (darkMode
                      ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-400'
                      : 'bg-white placeholder:text-gray-500')
                  }
                  placeholder="mm/dd/yyyy"
                  required
                />
              </div>
              <div>
                <label className="block font-medium mb-2 text-gray-800" htmlFor="studentEmail">Email Address</label>
                <input
                  type="email"
                  id="studentEmail"
                  name="studentEmail"
                  value={form.studentEmail || ""}
                  onChange={handleChange}
                  className={
                    `w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none placeholder:text-gray-500 ` +
                    (darkMode
                      ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-400'
                      : 'bg-white placeholder:text-gray-500')
                  }
                  placeholder="Email Address"
                  required
                />
              </div>
              <div>
                <label className="block font-medium mb-2 text-gray-800" htmlFor="studentRoom">Room</label>
                <input
                  type="text"
                  id="studentRoom"
                  name="studentRoom"
                  value={form.studentRoom}
                  onChange={handleChange}
                  className={
                    `w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none placeholder:text-gray-500 ` +
                    (darkMode
                      ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-400'
                      : 'bg-white placeholder:text-gray-500')
                  }
                  placeholder="Room No."
                  required
                />
              </div>
              <div>
                <label className="block font-medium mb-2 text-gray-800" htmlFor="studentBuilding">Building</label>
                <select
                  id="studentBuilding"
                  name="studentBuilding"
                  value={form.studentBuilding || ""}
                  onChange={handleChange}
                  className={
                    `w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none placeholder:text-gray-500 ` +
                    (darkMode
                      ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-400'
                      : 'bg-white placeholder:text-gray-500')
                  }
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
              <div className="md:col-span-3">
                <label className="block font-medium mb-2 text-gray-800">Signature</label>
                <div
                  ref={sigPadContainerRef}
                  className={
                    `border rounded-lg p-4 flex flex-col items-center w-full max-w-xs md:max-w-md mx-auto shadow-sm ` +
                    (darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200')
                  }
                >
                  <SignaturePad
                    ref={sigPadRef}
                    penColor="black"
                    canvasProps={{
                      width: sigPadWidth,
                      height: 120,
                      className: `rounded border w-full ` + (darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200')
                    }}
                    onEnd={() => setSignatureData(sigPadRef.current?.isEmpty() ? null : sigPadRef.current?.toDataURL())}
                  />
                  <div className="flex gap-2 mt-2">
                    <button type="button" onClick={clearSignature} className="px-4 py-1 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition">Clear</button>
                  </div>
                  {!signatureData && <span className="text-xs text-red-500 mt-1">Please provide your signature above.</span>}
                </div>
              </div>
            </div>
          </div>
          {/* Parent Info Section */}
          <div>
            <h2 className="text-xl font-bold mb-6 col-span-3 text-blue-600 tracking-wide">Parent Info</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block font-medium mb-2 text-gray-800" htmlFor="parentLastName">Last Name</label>
                <input
                  type="text"
                  id="parentLastName"
                  name="parentLastName"
                  value={form.parentLastName}
                  onChange={handleChange}
                  className={
                    `w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none placeholder:text-gray-500 ` +
                    (darkMode
                      ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-400'
                      : 'bg-white placeholder:text-gray-500')
                  }
                  placeholder="Parent Last Name"
                  required
                />
              </div>
              <div>
                <label className="block font-medium mb-2 text-gray-800" htmlFor="parentFirstName">First Name</label>
                <input
                  type="text"
                  id="parentFirstName"
                  name="parentFirstName"
                  value={form.parentFirstName}
                  onChange={handleChange}
                  className={
                    `w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none placeholder:text-gray-500 ` +
                    (darkMode
                      ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-400'
                      : 'bg-white placeholder:text-gray-500')
                  }
                  placeholder="Parent First Name"
                  required
                />
              </div>
              <div>
                <label className="block font-medium mb-2 text-gray-800" htmlFor="parentContact">Contact No.</label>
                <input
                  type="text"
                  id="parentContact"
                  name="parentContact"
                  value={form.parentContact}
                  onChange={handleChange}
                  className={
                    `w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none placeholder:text-gray-500 ` +
                    (darkMode
                      ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-400'
                      : 'bg-white placeholder:text-gray-500')
                  }
                  placeholder="Contact No."
                  required
                />
              </div>
              <div>
                <label className="block font-medium mb-2 text-gray-800" htmlFor="parentAltContact">Alternative Contact No.</label>
                <input
                  type="text"
                  id="parentAltContact"
                  name="parentAltContact"
                  value={form.parentAltContact}
                  onChange={handleChange}
                  className={
                    `w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none placeholder:text-gray-500 ` +
                    (darkMode
                      ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-400'
                      : 'bg-white placeholder:text-gray-500')
                  }
                  placeholder="Alternative Contact No."
                  required
                />
              </div>
              <div>
                <label className="block font-medium mb-2 text-gray-800" htmlFor="parentAddress">Address</label>
                <input
                  type="text"
                  id="parentAddress"
                  name="parentAddress"
                  value={form.parentAddress}
                  onChange={handleChange}
                  className={
                    `w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none placeholder:text-gray-500 ` +
                    (darkMode
                      ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-400'
                      : 'bg-white placeholder:text-gray-500')
                  }
                  placeholder="Address"
                  required
                />
              </div>
              <div>
                <label className="block font-medium mb-2 text-gray-800" htmlFor="parentRelation">Relation</label>
                <input
                  type="text"
                  id="parentRelation"
                  name="parentRelation"
                  value={form.parentRelation}
                  onChange={handleChange}
                  className={
                    `w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none placeholder:text-gray-500 ` +
                    (darkMode
                      ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-400'
                      : 'bg-white placeholder:text-gray-500')
                  }
                  placeholder="Relation"
                  required
                />
              </div>
              <div>
                <label className="block font-medium mb-2 text-gray-800" htmlFor="parentEmail">Email Address</label>
                <input
                  type="email"
                  id="parentEmail"
                  name="parentEmail"
                  value={form.parentEmail || ""}
                  onChange={handleChange}
                  className={
                    `w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none placeholder:text-gray-500 ` +
                    (darkMode
                      ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-400'
                      : 'bg-white placeholder:text-gray-500')
                  }
                  placeholder="Parent Email Address"
                  required
                />
              </div>
            </div>
          </div>
          {/* Alternate Emergency Person Section */}
          <div>
            <h2 className="text-xl font-bold mb-6 col-span-3 text-blue-600 tracking-wide">Alternate Emergency Person</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block font-medium mb-2 text-gray-800" htmlFor="altEmergencyLastName">Last Name</label>
                <input
                  type="text"
                  id="altEmergencyLastName"
                  name="altEmergencyLastName"
                  value={form.altEmergencyLastName}
                  onChange={handleChange}
                  className={
                    `w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none placeholder:text-gray-500 ` +
                    (darkMode
                      ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-400'
                      : 'bg-white placeholder:text-gray-500')
                  }
                  placeholder="Alt. Emergency Last Name"
                  required
                />
              </div>
              <div>
                <label className="block font-medium mb-2 text-gray-800" htmlFor="altEmergencyFirstName">First Name</label>
                <input
                  type="text"
                  id="altEmergencyFirstName"
                  name="altEmergencyFirstName"
                  value={form.altEmergencyFirstName}
                  onChange={handleChange}
                  className={
                    `w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none placeholder:text-gray-500 ` +
                    (darkMode
                      ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-400'
                      : 'bg-white placeholder:text-gray-500')
                  }
                  placeholder="Alt. Emergency First Name"
                  required
                />
              </div>
              <div>
                <label className="block font-medium mb-2 text-gray-800" htmlFor="altEmergencyContact">Contact No.</label>
                <input
                  type="text"
                  id="altEmergencyContact"
                  name="altEmergencyContact"
                  value={form.altEmergencyContact}
                  onChange={handleChange}
                  className={
                    `w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none placeholder:text-gray-500 ` +
                    (darkMode
                      ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-400'
                      : 'bg-white placeholder:text-gray-500')
                  }
                  placeholder="Contact No."
                  required
                />
              </div>
            </div>
          </div>
          {/* Appliance Selection Section */}
          <div>
            <h2 className="text-xl font-bold mb-6 col-span-3 text-blue-600 tracking-wide">Appliance Declaration</h2>
            <div className="mb-2 font-semibold">Free-Charge Items</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 mb-4">
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
                    className={applianceBoxClass(selected, darkMode)}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {[
                { key: "hairDryer", label: "Hair Dryer", fee: 1500 },
                { key: "hairIron", label: "Hair Iron", fee: 1500 },
                { key: "clothesSteamer", label: "Clothes Steamer", fee: 1500 },
                { key: "airPurifier", label: "Air Purifier", fee: 2000 },
                { key: "dehumidifier", label: "Dehumidifier (max 60Watts)", fee: 2000 },
                { key: "handheldVacuum", label: "Handheld Vacuum", fee: 2000 },
                { key: "deskFan", label: "Conventional Elec Fan (Desk/Stand Fan 30Watts-60Watts max)", fee: 2000 },
                { key: "rechargeableFan", label: "Rechargeable Elec Fan (6Watts-29Watts)", fee: 1000 },
                { key: "airCooler", label: "Air Cooler", fee: 3000 },
              ].map(item => {
                const selected = form.appliances.includes(item.key);
                return (
                  <div
                    key={item.key}
                    className={applianceBoxClass(selected, darkMode)}
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
            <div className="mb-2 font-semibold">Food and Beverage Appliances <span className='font-normal'>(must be used only in Pantries, except for ref, which must stay in the room)</span></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {[
                { key: "kettle", label: "Electric Kettle", fee: 1500 },
                { key: "riceCooker", label: "Rice Cooker", fee: 1500 },
                { key: "coffeeMaker", label: "Coffee Maker", fee: 1500 },
                { key: "blender", label: "Portable Blender", fee: 1500 },
                { key: "sandwichMaker", label: "Sandwich Maker", fee: 1500 },
                { key: "airFryer", label: "Air Fryer", fee: 2000 },
                { key: "refrigerator", label: "Refrigerator (max 5 cu.ft; 1 ref/room)", fee: 4500 },
              ].map(item => {
                const selected = form.appliances.includes(item.key);
                return (
                  <div
                    key={item.key}
                    className={applianceBoxClass(selected, darkMode)}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {[
                { key: "escooter", label: "E-bike or E-Scooter", fee: 3000 },
                { key: "smartHome", label: "Smart Home Devices (speaker, etc.)", fee: 3000 },
                { key: "projector", label: "Portable Projector", fee: 3000 },
                { key: "extraLaptop", label: "Additional laptop / desktop, monitors, non handheld gaming console, etc.", fee: 5000 },
              ].map(item => {
                const selected = form.appliances.includes(item.key);
                return (
                  <div
                    key={item.key}
                    className={applianceBoxClass(selected, darkMode)}
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
            <div className="mb-2 font-semibold mt-6">Other Appliances</div>
            <div className="flex flex-col gap-4 mb-4">
              <input
                type="text"
                name="otherAppliances"
                value={form.otherAppliances}
                onChange={handleChange}
                className={
                  `w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none placeholder:text-gray-500 ` +
                  (darkMode
                    ? 'bg-gray-900 border-gray-700 text-gray-100 placeholder:text-gray-400'
                    : 'bg-white placeholder:text-gray-500')
                }
                placeholder="Please declare other items not listed above"
              />
              <input
                type="number"
                min="0"
                step="any"
                value={otherApplianceCost}
                onChange={e => setOtherApplianceCost(e.target.value)}
                className={
                  `w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none placeholder:text-gray-500 ` +
                  (darkMode
                    ? 'bg-gray-900 border-gray-700 text-gray-100 placeholder:text-gray-400'
                    : 'bg-white placeholder:text-gray-500')
                }
                placeholder="Optional: Cost for other appliances (if applicable)"
              />
            </div>
            <div className="mt-4 text-lg font-bold text-right">
              Total Amount to be Paid: <span className="text-red-600">{totalApplianceFee.toLocaleString()}</span>
            </div>
          </div>
          {/* Choice of Appliance will be added later */}
          <button
            type="submit"
            className={
              `w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white py-3 rounded-xl font-bold hover:from-blue-600 hover:to-blue-800 transition mt-6 shadow-lg text-lg tracking-wide ` +
              (darkMode ? 'bg-gradient-to-r from-blue-800 to-blue-900' : '')
            }
          >
            Submit
          </button>
        </form>
        {/* Modal Popup for Downloads */}
        {showModal && (
          <div className={
            `fixed inset-0 flex items-center justify-center z-50 ` +
            (darkMode
              ? 'bg-black/70 backdrop-blur-sm'
              : 'bg-white/70 backdrop-blur-sm')
          }>
            <div className={
              `rounded-lg shadow-lg p-8 max-w-md w-full text-center border ` +
              (darkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-900')
            }>
              <h2 className="text-xl font-bold mb-4">Download Your Filled Forms</h2>
              <button
                type="button"
                onClick={() => downloadApplianceDeclaration()}
                className={
                  `w-full text-xs py-1 rounded transition mb-2 border font-semibold ` +
                  (darkMode
                    ? 'bg-green-900 text-green-200 border-green-700 hover:bg-green-800'
                    : 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200')
                }
              >
                {`Download ADF_${form.studentNumber || 'Student No.'}_${getStudentFullName() || 'Last Name, First Name'}`}
              </button>
              <button
                type="button"
                onClick={() => downloadTermsAndConditions()}
                className={
                  `w-full text-xs py-1 rounded transition mb-2 border font-semibold ` +
                  (darkMode
                    ? 'bg-blue-900 text-blue-200 border-blue-700 hover:bg-blue-800'
                    : 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200')
                }
              >
                {`Download TC_${form.studentNumber || 'Student No.'}_${getStudentFullName() || 'Last Name, First Name'}`}
              </button>
              <button
                type="button"
                onClick={() => downloadResidencyAgreement()}
                className={
                  `w-full text-xs py-1 rounded transition mb-2 border font-semibold ` +
                  (darkMode
                    ? 'bg-purple-900 text-purple-200 border-purple-700 hover:bg-purple-800'
                    : 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200')
                }
              >
                {`Download RA_${form.studentNumber || 'Student No.'}_${getStudentFullName() || 'Last Name, First Name'}`}
              </button>
              <button
                type="button"
                onClick={() => downloadDataPrivacyPolicy()}
                className={
                  `w-full text-xs py-1 rounded transition mb-2 border font-semibold ` +
                  (darkMode
                    ? 'bg-pink-900 text-pink-200 border-pink-700 hover:bg-pink-800'
                    : 'bg-pink-100 text-pink-800 border-pink-200 hover:bg-pink-200')
                }
              >
                {`Download DPP_${form.studentNumber || 'Student No.'}_${getStudentFullName() || 'Last Name, First Name'}`}
              </button>
              <button
                type="button"
                onClick={() => downloadConsentForm()}
                className={
                  `w-full text-xs py-1 rounded transition mb-2 border font-semibold ` +
                  (darkMode
                    ? 'bg-orange-900 text-orange-200 border-orange-700 hover:bg-orange-800'
                    : 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200')
                }
              >
                {`Download CF_${form.studentNumber || 'Student No.'}_${getStudentFullName() || 'Last Name, First Name'}`}
              </button>
              <button
                type="button"
                onClick={() => downloadAll()}
                className={
                  `w-full py-2 rounded font-bold transition mb-4 mt-2 shadow-lg text-base ` +
                  (darkMode ? 'bg-blue-700 text-white hover:bg-blue-800' : 'bg-blue-600 text-white hover:bg-blue-700')
                }
              >
                Download All
              </button>
              <button
                onClick={() => setShowModal(false)}
                className={
                  `w-full py-2 rounded font-semibold transition ` +
                  (darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-400 text-white hover:bg-gray-500')
                }
              >
                Close
              </button>
            </div>
          </div>
        )}
        {/* Render preview modal */}
        {showPreviewModal && (
          <div className={
            `fixed inset-0 flex items-center justify-center z-50 ` +
            (darkMode
              ? 'bg-black/70 backdrop-blur-sm'
              : 'bg-white/70 backdrop-blur-sm')
          }>
            <div className={
              `rounded-lg shadow-lg p-8 max-w-2xl w-full text-center overflow-y-auto max-h-[90vh] border ` +
              (darkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-900')
            }>
              <h2 className="text-xl font-bold mb-4">Double check your filled forms below before downloading.</h2>
              <p>Generating Preview</p>
              <div className="flex flex-col md:flex-row gap-4 justify-center mt-6">
                <button
                  type="button"
                  className={
                    `px-4 py-2 rounded shadow transition font-semibold ` +
                    (darkMode ? 'bg-blue-700 text-white hover:bg-blue-800' : 'bg-blue-600 text-white hover:bg-blue-700')
                  }
                  onClick={() => { setShowPreviewModal(false); setShowModal(true); }}
                >
                  Proceed to Download
                </button>
                <button
                  type="button"
                  className={
                    `px-4 py-2 rounded shadow transition font-semibold ` +
                    (darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-400 text-white hover:bg-gray-500')
                  }
                  onClick={() => setShowPreviewModal(false)}
                >
                  Back to Form
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
