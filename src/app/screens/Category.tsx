import { useEffect, useState } from "react";
import { Phone, Calendar, ArrowUpDown, Plus, QrCode } from "lucide-react";
import { JobDetailForm } from "../components/JobDetailForm";
import { QRCodeScannerModal } from "../components/QRCodeScannerModal";
import { supabase } from "../lib/supabaseClient";
import { shouldShowJob } from "../lib/jobVisibility";
import { extractJobCodeFromQrValue } from "../lib/qrUtils";
import { useAuth } from "../context/AuthContext";

type FilterType =
  | "All"
  | "Inbox"
  | "Not Reviewed"
  | "Under Review"
  | "Estimate Pending"
  | "Estimate Approved"
  | "On Workbench"
  | "Ready to Deliver"
  | "Delivered"
  | "Completed"
  | "Most Urgent";

interface Job {
  id: string;
  customerName: string;
  phone: string;
  problem: string;
  date: string;
  status: string;
}

export function Category() {
  const { business } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [sortNewest, setSortNewest] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showNewJobForm, setShowNewJobForm] = useState(false);
  const [scannedJobId, setScannedJobId] = useState<string>("");
  const [showScanner, setShowScanner] = useState(false);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const filters: FilterType[] = [
    "All",
    "Inbox",
    "Not Reviewed",
    "Under Review",
    "Estimate Pending",
    "Estimate Approved",
    "On Workbench",
    "Ready to Deliver",
    "Delivered",
    "Completed",
    "Most Urgent",
  ];

  const loadJobs = async () => {
    if (!business?.id) {
      setAllJobs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("jobs")
      .select("id, title, status, created_at, customer_name, mobile_number, problem_reported")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading jobs:", error);
      setAllJobs([]);
      setLoading(false);
      return;
    }

    const visibleJobs = (data || []).filter((j: any) => shouldShowJob(j));

    const mapped: Job[] = visibleJobs.map((j: any) => ({
      id: j.id,
      customerName: j.customer_name || j.title || "Customer",
      phone: j.mobile_number || "-",
      problem: j.problem_reported || j.title || "Service Job",
      date: j.created_at,
      status: j.status || "Inbox",
    }));

    setAllJobs(mapped);
    setLoading(false);
  };

  useEffect(() => {
    loadJobs();
  }, [business?.id]);

  const filteredJobs = allJobs.filter((job) => {
    if (activeFilter === "All") return true;
    return job.status === activeFilter;
  });

  const isPlaceholderJob = (job: Job) => {
    const customer = (job.customerName || "").trim().toLowerCase();
    const problem = (job.problem || "").trim().toLowerCase();
    return customer === "new job" || problem === "new job";
  };

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    const aPlaceholder = isPlaceholderJob(a);
    const bPlaceholder = isPlaceholderJob(b);

    if (aPlaceholder !== bPlaceholder) {
      return aPlaceholder ? 1 : -1;
    }

    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return sortNewest ? dateB - dateA : dateA - dateB;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "Not Reviewed": "bg-red-100 text-red-700",
      "Inbox": "bg-gray-100 text-gray-700",
      "Under Review": "bg-yellow-100 text-yellow-700",
      "Estimate Pending": "bg-orange-100 text-orange-700",
      "Estimate Approved": "bg-green-100 text-green-700",
      "On Workbench": "bg-blue-100 text-blue-700",
      "Ready to Deliver": "bg-purple-100 text-purple-700",
      "Delivered": "bg-emerald-100 text-emerald-700",
      "Completed": "bg-green-100 text-green-700",
      "Most Urgent": "bg-red-100 text-red-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", { 
      day: "numeric", 
      month: "short", 
      year: "numeric" 
    });
  };

  if (selectedJob) {
    return (
      <JobDetailForm
        job={selectedJob}
        onSaved={loadJobs}
        onClose={() => setSelectedJob(null)}
      />
    );
  }

  if (showNewJobForm || scannedJobId) {
    return (
      <JobDetailForm
        jobId={scannedJobId}
        onSaved={loadJobs}
        onClose={() => {
          setShowNewJobForm(false);
          setScannedJobId("");
        }}
      />
    );
  }

  const handleScanQR = () => {
    setShowScanner(true);
  };

  const handleScannedValue = (rawValue: string) => {
    setShowScanner(false);

    const extracted = extractJobCodeFromQrValue(rawValue);

    if (extracted) {
      setScannedJobId(extracted);
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-[#4D4D4D]">Category</h1>
          <div className="flex gap-2">
            <button
              onClick={handleScanQR}
              className="flex items-center gap-2 px-4 py-2 bg-white text-[#628F97] rounded-lg border border-[#628F97] hover:bg-[#628F97]/5 transition-colors"
            >
              <QrCode className="w-5 h-5" />
              <span>Scan QR</span>
            </button>
            <button
              onClick={() => setShowNewJobForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#B9CE18] text-white rounded-lg hover:bg-[#a8bc14] transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>New Job</span>
            </button>
          </div>
        </div>
        <p className="text-[#717182]">All service jobs</p>
      </div>

      {/* Filter Chips */}
      <div className="mb-6 overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-max">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                activeFilter === filter
                  ? "bg-[#B9CE18] text-white shadow-md"
                  : "bg-white text-[#4D4D4D] border border-gray-200 hover:border-[#B9CE18]"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Sorting Toggle */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[#717182]">
          {sortedJobs.length} {sortedJobs.length === 1 ? "job" : "jobs"}
        </p>
        <button
          onClick={() => setSortNewest(!sortNewest)}
          className="flex items-center gap-2 text-sm text-[#628F97] hover:text-[#4D4D4D]"
        >
          <ArrowUpDown className="w-4 h-4" />
          {sortNewest ? "Newest First" : "Oldest First"}
        </button>
      </div>

      {/* Job List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-[#717182]">Loading jobs...</p>
          </div>
        ) : (
          sortedJobs.map((job) => (
          <div
            key={job.id}
            onClick={() => setSelectedJob(job)}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                <h3 className="text-[#4D4D4D] mb-1">{job.customerName}</h3>
                <div className="flex items-center gap-2 text-sm text-[#717182] mb-2">
                  <Phone className="w-4 h-4" />
                  <span>{job.phone}</span>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs ${getStatusColor(
                  job.status
                )}`}
              >
                {job.status}
              </span>
            </div>

            <p className="text-[#4D4D4D] mb-3">{job.problem}</p>

            <div className="flex items-center gap-2 text-sm text-[#717182]">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(job.date)}</span>
              <span className="ml-auto text-[#628F97]">{job.id.slice(0, 8)}</span>
            </div>
          </div>
        ))
        )}
      </div>

      {sortedJobs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[#717182]">No jobs found for this filter</p>
        </div>
      )}

      <QRCodeScannerModal
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onDetected={handleScannedValue}
      />
    </div>
  );
}