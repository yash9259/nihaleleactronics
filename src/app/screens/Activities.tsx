import { useEffect, useState } from "react";
import { Clock, CheckCircle, AlertCircle, FileEdit, Package, User } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  icon: React.ComponentType<any>;
  color: string;
}

export function Activities() {
  const { business } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!business?.id) {
      setLoading(false);
      return;
    }

    const fetchActivities = async () => {
      try {
        const { data: jobs, error } = await supabase
          .from("jobs")
          .select("id, title, status, created_at")
          .eq("business_id", business.id)
          .order("created_at", { ascending: false })
          .limit(20);

        if (error || !jobs) {
          console.error("Error fetching jobs:", error);
          setLoading(false);
          return;
        }

        const activityList: Activity[] = jobs.map((job: any) => ({
          id: job.id,
          type: "job_created",
          title: "Job " + (job.status || "created"),
          description: `${job.id?.substring(0, 8)} - ${job.title || "Service Job"}`,
          timestamp: job.created_at,
          icon: job.status === "Completed" ? CheckCircle : FileEdit,
          color:
            job.status === "Completed"
              ? "bg-green-100 text-green-700"
              : "bg-blue-100 text-blue-700",
        }));

        setActivities(activityList);
      } catch (err) {
        console.error("Error in fetchActivities:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [business?.id]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60)
      );
      return `${diffInMinutes} mins ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const groupActivitiesByDate = () => {
    const groups: { [key: string]: Activity[] } = {};

    activities.forEach((activity) => {
      const date = new Date(activity.timestamp);
      const dateKey = date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(activity);
    });

    return groups;
  };

  const groupedActivities = groupActivitiesByDate();

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[#4D4D4D] mb-2">Activities</h1>
        <p className="text-[#717182]">Recent job activities and updates</p>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-12 text-[#717182]">
            Loading activities...
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12 text-[#717182]">
            No activities found
          </div>
        ) : (
          Object.entries(groupedActivities).map(([date, items]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-gray-200" />
                <p className="text-sm text-[#717182] px-3">{date}</p>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <div className="space-y-3">
                {items.map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div
                      key={activity.id}
                      className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`${activity.color} p-3 rounded-lg flex-shrink-0`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-[#4D4D4D] mb-1">
                            {activity.title}
                          </h3>
                          <p className="text-sm text-[#717182] mb-2">
                            {activity.description}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-[#717182]">
                            <Clock className="w-3 h-3" />
                            <span>{formatTimestamp(activity.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
