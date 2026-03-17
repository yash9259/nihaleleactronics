import { useEffect, useRef, useState } from "react";
import { QrCode, Download, Printer, Share2, Trash2 } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { jsPDF } from "jspdf";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

interface QRJob {
  id: string;
  external_job_id?: string | null;
}

export function GenerateQR() {
  const { business } = useAuth();
  const [jobs, setJobs] = useState<QRJob[]>([]);
  const [jobCount, setJobCount] = useState<string>("1");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

  const loadJobs = async () => {
    if (!business?.id) {
      setJobs([]);
      setInitialLoading(false);
      return;
    }

    try {
      setErrorMessage(null);
      const { data: dbJobs, error } = await supabase
        .from("jobs")
        .select("id, external_job_id")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false });

      if (error || !dbJobs) {
        console.error("Error fetching jobs:", error);
        setErrorMessage(error?.message ?? "Failed to load jobs");
        setJobs([]);
        setInitialLoading(false);
        return;
      }

      setJobs(dbJobs.map((j: any) => ({ id: j.id, external_job_id: j.external_job_id })));      
      setInitialLoading(false);
    } catch (err) {
      console.error("Error:", err);
      setErrorMessage("Failed to load jobs from database");
      setJobs([]);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [business?.id]);

  const handleGenerateQr = async () => {
    if (!business?.id) {
      setErrorMessage("Business not loaded. Please login again.");
      return;
    }

    const count = Math.max(1, Math.min(100, parseInt(jobCount, 10) || 1));
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const rows = Array.from({ length: count }).map(() => ({
      external_job_id: `JOB-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      business_id: business.id,
      title: "New Job",
      status: "Inbox",
    }));

    const { error } = await supabase.from("jobs").insert(rows);
    if (error) {
      console.error("Error generating jobs:", error);
      setErrorMessage(`Failed to generate QR: ${error.message}`);
      setLoading(false);
      return;
    }

    await loadJobs();
    setSuccessMessage(`Generated ${count} QR job${count > 1 ? "s" : ""} successfully.`);
    setLoading(false);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const downloadCanvas = (canvas: HTMLCanvasElement | null, filename: string) => {
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadOne = (id: string) => {
    downloadCanvas(canvasRefs.current[id], `${id}.png`);
  };

  const handleDownloadAll = () => {
    if (validJobs.length === 0) return;

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const marginX = 12;
    const marginY = 12;
    const qrSize = 11.43;
    const gapX = 6;
    const gapY = 6;
    const cols = 6;
    const rows = 8;
    const perPage = cols * rows;

    validJobs.forEach((job, index) => {
      const canvas = canvasRefs.current[job.id];
      if (!canvas) return;

      if (index > 0 && index % perPage === 0) {
        pdf.addPage();
      }

      const pageIndex = index % perPage;
      const col = pageIndex % cols;
      const row = Math.floor(pageIndex / cols);
      const x = marginX + col * (qrSize + gapX);
      const y = marginY + row * (qrSize + gapY);

      const dataUrl = canvas.toDataURL("image/png");
      pdf.addImage(dataUrl, "PNG", x, y, qrSize, qrSize);
    });

    pdf.save("qr-codes.pdf");
  };

  const handlePrintAll = () => {
    window.print();
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) {
      alert("Select QR codes to delete");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("jobs").delete().in("id", selectedIds);
      if (error) {
        setErrorMessage(`Failed to delete selected jobs: ${error.message}`);
        setLoading(false);
        return;
      }
      setJobs((prev) => prev.filter((job) => !selectedIds.includes(job.id)));
      setSelectedIds([]);
      setSuccessMessage("Selected jobs deleted successfully.");
    } catch (err) {
      console.error("Error deleting jobs:", err);
      setErrorMessage("Failed to delete selected jobs");
    } finally {
      setLoading(false);
    }
  };

  const validJobs = jobs.filter((job) => job.id.trim() !== "");
  const getQrUrl = (job: QRJob) => {
    const jobCode = job.external_job_id || job.id;
    if (typeof window === "undefined") return jobCode;
    return `${window.location.origin}/open-job?job=${encodeURIComponent(jobCode)}`;
  };

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[#4D4D4D] mb-2">Generate QR Codes</h1>
        <p className="text-[#717182]">Create QR codes for job tracking</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 mb-3">
          <input
            type="number"
            min={1}
            max={100}
            value={jobCount}
            onChange={(e) => setJobCount(e.target.value)}
            placeholder="How many QR jobs to generate"
            className="w-full px-4 py-3 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none"
          />
          <button
            onClick={handleGenerateQr}
            disabled={loading}
            className="px-4 py-3 bg-[#B9CE18] text-white rounded-lg hover:bg-[#a8bc14] transition-colors disabled:opacity-60"
          >
            Generate QR
          </button>
        </div>
        <p className="text-xs text-[#717182]">Creates job records and generates QR for each job.</p>
      </div>

      {errorMessage && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {validJobs.length > 0 && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <button
                onClick={handleDownloadAll}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#628F97] text-white rounded-lg hover:bg-[#537D85] transition-colors"
              >
                <Download className="w-5 h-5" />
                <span>Download All</span>
              </button>
              <button
                onClick={handlePrintAll}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#628F97] text-white rounded-lg hover:bg-[#537D85] transition-colors"
              >
                <Printer className="w-5 h-5" />
                <span>Print All</span>
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                <Trash2 className="w-5 h-5" />
                <span>Delete Selected</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {validJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-xl border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-[#4D4D4D] mb-1">Job ID: {job.external_job_id || job.id?.substring(0, 8)}</p>
                    <label className="flex items-center gap-2 text-sm text-[#717182]">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(job.id)}
                        onChange={() => handleToggleSelect(job.id)}
                        className="h-4 w-4 accent-[#628F97]"
                      />
                      Select
                    </label>
                  </div>
                </div>

                <div className="bg-white border-2 border-[#628F97] rounded-lg p-6 mb-4 flex items-center justify-center">
                  <div className="w-full aspect-square bg-white rounded flex items-center justify-center">
                    <QRCodeCanvas
                      value={getQrUrl(job)}
                      size={180}
                      includeMargin
                      bgColor="#FFFFFF"
                      fgColor="#628F97"
                      level="M"
                      ref={(node) => {
                        canvasRefs.current[job.id] = node;
                      }}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownloadOne(job.id)}
                    className="flex-1 p-2 bg-[#628F97]/10 text-[#628F97] rounded hover:bg-[#628F97]/20 transition-colors"
                  >
                    <Download className="w-4 h-4 mx-auto" />
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex-1 p-2 bg-[#628F97]/10 text-[#628F97] rounded hover:bg-[#628F97]/20 transition-colors"
                  >
                    <Printer className="w-4 h-4 mx-auto" />
                  </button>
                  <button
                    onClick={() => {
                      const canvas = canvasRefs.current[job.id];
                      if (canvas) downloadCanvas(canvas, `${job.id}.png`);
                    }}
                    className="flex-1 p-2 bg-[#628F97]/10 text-[#628F97] rounded hover:bg-[#628F97]/20 transition-colors"
                  >
                    <Share2 className="w-4 h-4 mx-auto" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {initialLoading && (
        <div className="text-center py-12 bg-[#B9CE18]/10 rounded-xl">
          <p className="text-[#717182]">Loading jobs from database...</p>
        </div>
      )}

      {!initialLoading && validJobs.length === 0 && (
        <div className="text-center py-12 bg-[#B9CE18]/10 rounded-xl">
          <p className="text-[#717182]">No jobs yet. Generate QR to create jobs.</p>
        </div>
      )}
    </div>
  );
}
