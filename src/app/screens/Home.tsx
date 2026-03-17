import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { 
  ClipboardList, 
  CheckCircle, 
  Wrench, 
  Package, 
  Clock,
  QrCode
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { shouldShowJob } from "../lib/jobVisibility";
import { extractJobCodeFromQrValue } from "../lib/qrUtils";
import { useAuth } from "../context/AuthContext";
import { JobDetailForm } from "../components/JobDetailForm";
import { QRCodeScannerModal } from "../components/QRCodeScannerModal";

interface Job {
  id: string;
  title: string;
  status: string;
  created_at: string;
}

export function Home() {
  const navigate = useNavigate();
  const { business } = useAuth();
  const [scannedJobId, setScannedJobId] = useState<string>("");
  const [showScanner, setShowScanner] = useState(false);
  const [jobCounts, setJobCounts] = useState<Record<string, number>>({});
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!business?.id) {
      setLoading(false);
      return;
    }

    const fetchJobs = async () => {
      try {
        const { data: jobs, error } = await supabase
          .from("jobs")
          .select("id, title, status, created_at, customer_name, mobile_number, problem_reported")
          .eq("business_id", business.id)
          .order("created_at", { ascending: false });

        if (error || !jobs) {
          console.error("Error fetching jobs:", error);
          setLoading(false);
          return;
        }

        const counts: Record<string, number> = {
          "Not Reviewed": 0,
          "Estimate Approved": 0,
          "On Workbench": 0,
          "Ready to Deliver": 0,
          "Completed": 0,
        };

        const visibleJobs = jobs.filter((job: any) => shouldShowJob(job));

        visibleJobs.forEach((job) => {
          const status = job.status || "Not Reviewed";
          if (status in counts) {
            counts[status]++;
          }
        });

        setJobCounts(counts);
        setRecentJobs(visibleJobs.slice(0, 4));
      } catch (err) {
        console.error("Error in fetchJobs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [business?.id]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

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

  if (scannedJobId) {
    return (
      <JobDetailForm
        jobId={scannedJobId}
        onClose={() => setScannedJobId("")}
      />
    );
  }

  const summaryCards = [
    {
      title: "Not Reviewed",
      count: jobCounts["Not Reviewed"] || 0,
      icon: ClipboardList,
      color: "bg-red-50 text-red-600",
      iconBg: "bg-red-100",
    },
    {
      title: "Estimate Approved",
      count: jobCounts["Estimate Approved"] || 0,
      icon: CheckCircle,
      color: "bg-green-50 text-green-600",
      iconBg: "bg-green-100",
    },
    {
      title: "On Workbench",
      count: jobCounts["On Workbench"] || 0,
      icon: Wrench,
      color: "bg-blue-50 text-blue-600",
      iconBg: "bg-blue-100",
    },
    {
      title: "Ready to Deliver",
      count: jobCounts["Ready to Deliver"] || 0,
      icon: Package,
      color: "bg-purple-50 text-purple-600",
      iconBg: "bg-purple-100",
    },
    {
      title: "Job Completed Today",
      count: jobCounts["Completed"] || 0,
      icon: CheckCircle,
      color: "bg-[#B9CE18]/10 text-[#628F97]",
      iconBg: "bg-[#B9CE18]/20",
    },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[#4D4D4D] mb-2">Dashboard</h1>
        <p className="text-[#717182]">{business?.name || "Service Center"}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className={`${card.color} rounded-xl p-5 transition-all hover:shadow-md cursor-pointer`}
              onClick={() => navigate("/category")}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm opacity-80 mb-1">{card.title}</p>
                  <p className="text-3xl font-semibold">{loading ? "-" : card.count}</p>
                </div>
                <div className={`${card.iconBg} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mb-6">
        <button
          onClick={handleScanQR}
          className="w-full bg-[#B9CE18] text-white rounded-xl p-5 flex items-center justify-center gap-3 hover:bg-[#a8bc14] transition-colors"
        >
          <QrCode className="w-6 h-6" />
          <span className="text-lg">Scan QR Code</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-[#4D4D4D]">Recent Activity</h3>
            <Clock className="w-5 h-5 text-[#717182]" />
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-4 text-center text-[#717182]">Loading...</div>
          ) : recentJobs.length === 0 ? (
            <div className="p-4 text-center text-[#717182]">No recent jobs</div>
          ) : (
            recentJobs.map((job) => (
              <div
                key={job.id}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => navigate("/category")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-[#4D4D4D]">
                        {job.id?.substring(0, 8)}
                      </span>
                      <span className="text-sm text-[#717182]">•</span>
                      <span className="text-sm text-[#4D4D4D]">
                        {job.title || "Job"}
                      </span>
                    </div>
                    <p className="text-sm text-[#717182]">Job registered</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#717182] mb-1">
                      {formatTime(job.created_at)}
                    </p>
                    <span className="inline-block px-2 py-1 bg-[#628F97]/10 text-[#628F97] rounded text-xs">
                      {job.status || "Not Reviewed"}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <QRCodeScannerModal
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onDetected={handleScannedValue}
      />
    </div>
  );
}
