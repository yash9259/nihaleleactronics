import { useNavigate, useSearchParams } from "react-router";
import { JobDetailForm } from "../components/JobDetailForm";

export function OpenJob() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobCode = searchParams.get("job")?.trim() || "";

  if (!jobCode) {
    return (
      <div className="p-4 lg:p-6 max-w-3xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <h2 className="text-[#4D4D4D] mb-2">Invalid QR Link</h2>
          <p className="text-[#717182] mb-4">This QR link does not contain a valid job code.</p>
          <button
            onClick={() => navigate("/category")}
            className="px-4 py-2 bg-[#B9CE18] text-white rounded-lg hover:bg-[#a8bc14] transition-colors"
          >
            Go to Category
          </button>
        </div>
      </div>
    );
  }

  return (
    <JobDetailForm
      jobId={jobCode}
      onClose={() => navigate("/category")}
      onSaved={() => navigate("/category")}
    />
  );
}
