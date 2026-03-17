import { useState, useEffect } from "react";
import { X, Phone, Save, Camera, Image, Plus, Trash2, FileText, Truck } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { jsPDF } from "jspdf";

interface Job {
  id: string;
  customerName: string;
  phone: string;
  problem: string;
  date: string;
  status: string;
}

interface JobDetailFormProps {
  job?: Job;
  onClose: () => void;
  jobId?: string;
  onSaved?: () => void;
}

interface StockItemUsed {
  id: string;
  stockItemId: string;
  itemName: string;
  availableQty: number;
  qtyUsed: number;
  rate: number;
  total: number;
}

interface AvailableStockItem {
  id: string;
  name: string;
  quantity: number;
  rate: number;
}

const JOB_STATUSES = [
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
] as const;

export function JobDetailForm({ job, onClose, jobId, onSaved }: JobDetailFormProps) {
  const { business, profile } = useAuth();
  const [availableStockItems, setAvailableStockItems] = useState<AvailableStockItem[]>([]);
  const [existingJobId, setExistingJobId] = useState<string | null>(job?.id ?? null);
  const [jobPartsLoadedFor, setJobPartsLoadedFor] = useState<string | null>(null);
  const [uploadedAttachmentPath, setUploadedAttachmentPath] = useState<string>("");
  const [uploadedAttachmentUrl, setUploadedAttachmentUrl] = useState<string>("");
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    // 1. Job Information
    jobId: job?.id || jobId || `JOB${Date.now()}`,
    jobDate: new Date().toISOString().split('T')[0],
    jobStatus: job?.status || "Inbox",

    // 2. Customer Details
    customerName: job?.customerName || "",
    mobileNumber: job?.phone || "",
    alternateMobile: "",
    address: "",
    city: "",
    pincode: "",

    // 3. Product Details
    productCategory: "",
    brand: "",
    modelName: "",
    serialNumber: "",
    warrantyStatus: "No",
    purchaseDate: "",

    // 4. Problem & Diagnosis
    problemReported: job?.problem || "",
    initialDiagnosis: "",
    technicianAssigned: "",
    priorityLevel: "Normal",

    // 5. Service & Repair Details
    serviceType: "Repair",

    // 6. Charges & Estimate
    laborCharges: 0,
    estimateApprovalStatus: "Pending",

    // 7. Work Progress
    workbenchStartDate: "",
    repairCompletionDate: "",
    readyToDeliverDate: "",

    // 8. Payment Details
    paymentStatus: "Unpaid",
    paymentMode: "Cash",
    paidAmount: 0,

    // 10. Notes
    internalNotes: "",
    customerRemarks: "",
  });

  const [stockItemsUsed, setStockItemsUsed] = useState<StockItemUsed[]>([]);
  const [saving, setSaving] = useState(false);

  const resolveAttachmentUrl = async (path: string) => {
    if (!path) {
      setUploadedAttachmentUrl("");
      return;
    }

    const { data, error } = await supabase.storage
      .from("job-images")
      .createSignedUrl(path, 60 * 60 * 24);

    if (error) {
      console.error("Error creating signed attachment URL:", error);
      setUploadedAttachmentUrl("");
      return;
    }

    setUploadedAttachmentUrl(data?.signedUrl || "");
  };

  useEffect(() => {
    if (!business?.id) return;

    const loadProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, quantity, rate")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading stock products:", error);
        return;
      }

      setAvailableStockItems((data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        quantity: p.quantity,
        rate: p.rate,
      })));
    };

    loadProducts();
  }, [business?.id]);

  useEffect(() => {
    if (!business?.id) return;

    const lookupValue = job?.id || jobId;
    if (!lookupValue) return;

    const loadExistingJob = async () => {
      let existing: any = null;

      const byExternal = await supabase
        .from("jobs")
        .select("*")
        .eq("business_id", business.id)
        .eq("external_job_id", lookupValue)
        .maybeSingle();

      if (!byExternal.error && byExternal.data) {
        existing = byExternal.data;
      }

      if (!existing && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(lookupValue)) {
        const byId = await supabase
          .from("jobs")
          .select("*")
          .eq("business_id", business.id)
          .eq("id", lookupValue)
          .maybeSingle();

        if (!byId.error && byId.data) {
          existing = byId.data;
        }
      }

      if (!existing) {
        return;
      }

      setExistingJobId(existing.id);
      setJobPartsLoadedFor(null);
      setFormData((prev) => ({
        ...prev,
        jobId: existing.external_job_id || existing.id,
        jobDate: existing.job_date || prev.jobDate,
        jobStatus: existing.status || prev.jobStatus,
        customerName: existing.customer_name || "",
        mobileNumber: existing.mobile_number || "",
        alternateMobile: existing.alternate_mobile || "",
        address: existing.address || "",
        city: existing.city || "",
        pincode: existing.pincode || "",
        productCategory: existing.product_category || "",
        brand: existing.brand || "",
        modelName: existing.model_name || "",
        serialNumber: existing.serial_number || "",
        warrantyStatus: existing.warranty_status || "No",
        purchaseDate: existing.purchase_date || "",
        problemReported: existing.problem_reported || existing.title || "",
        initialDiagnosis: existing.initial_diagnosis || "",
        technicianAssigned: existing.technician_assigned || "",
        priorityLevel: existing.priority_level || "Normal",
        serviceType: existing.service_type || "Repair",
        laborCharges: Number(existing.labor_charges || 0),
        estimateApprovalStatus: existing.estimate_approval_status || "Pending",
        workbenchStartDate: existing.workbench_start_date || "",
        repairCompletionDate: existing.repair_completion_date || "",
        readyToDeliverDate: existing.ready_to_deliver_date || "",
        paymentStatus: existing.payment_status || "Unpaid",
        paymentMode: existing.payment_mode || "Cash",
        paidAmount: Number(existing.paid_amount || 0),
        internalNotes: existing.internal_notes || "",
        customerRemarks: existing.customer_remarks || "",
      }));

      const existingAttachmentPath = existing.image_path || "";
      setUploadedAttachmentPath(existingAttachmentPath);
      await resolveAttachmentUrl(existingAttachmentPath);
    };

    loadExistingJob();
  }, [business?.id, job?.id, jobId]);

  useEffect(() => {
    if (!business?.id || !existingJobId || jobPartsLoadedFor === existingJobId) return;

    const loadJobParts = async () => {
      const { data, error } = await supabase
        .from("job_parts")
        .select("id, product_id, part_name, qty_used, rate")
        .eq("business_id", business.id)
        .eq("job_id", existingJobId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading job parts:", error);
        return;
      }

      const mapped: StockItemUsed[] = (data || []).map((part: any, index: number) => {
        const selectedStock = availableStockItems.find((stock) => stock.id === part.product_id);
        const qtyUsed = Number(part.qty_used || 0);
        const rate = Number(part.rate || 0);
        return {
          id: `${part.id || `part-${index}`}`,
          stockItemId: part.product_id || "",
          itemName: part.part_name || selectedStock?.name || "",
          availableQty: Number(selectedStock?.quantity || 0),
          qtyUsed,
          rate,
          total: qtyUsed * rate,
        };
      });

      setStockItemsUsed(mapped);
      setJobPartsLoadedFor(existingJobId);
    };

    loadJobParts();
  }, [business?.id, existingJobId, jobPartsLoadedFor, availableStockItems]);

  // Calculate totals
  const totalSpareCost = stockItemsUsed.reduce((sum, item) => sum + item.total, 0);
  const estimatedAmount = formData.laborCharges + totalSpareCost;
  const balanceAmount = estimatedAmount - formData.paidAmount;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddStockItem = () => {
    const newItem: StockItemUsed = {
      id: Date.now().toString(),
      stockItemId: "",
      itemName: "",
      availableQty: 0,
      qtyUsed: 0,
      rate: 0,
      total: 0,
    };
    setStockItemsUsed([...stockItemsUsed, newItem]);
  };

  const handleRemoveStockItem = (id: string) => {
    setStockItemsUsed(stockItemsUsed.filter(item => item.id !== id));
  };

  const handleStockItemChange = (id: string, stockItemId: string) => {
    const selectedStock = availableStockItems.find(s => s.id === stockItemId);
    if (selectedStock) {
      setStockItemsUsed(stockItemsUsed.map(item =>
        item.id === id
          ? {
              ...item,
              stockItemId,
              itemName: selectedStock.name,
              availableQty: selectedStock.quantity,
              rate: selectedStock.rate,
              total: item.qtyUsed * selectedStock.rate,
            }
          : item
      ));
      return;
    }

    setStockItemsUsed(stockItemsUsed.map(item =>
      item.id === id
        ? {
            ...item,
            stockItemId: "",
            itemName: "",
            availableQty: 0,
            rate: 0,
            qtyUsed: 0,
            total: 0,
          }
        : item
    ));
  };

  const handleQuantityChange = (id: string, qty: number) => {
    setStockItemsUsed(stockItemsUsed.map(item =>
      item.id === id
        ? {
            ...item,
            qtyUsed: Math.max(0, Math.min(qty, item.availableQty)),
            total: Math.max(0, Math.min(qty, item.availableQty)) * item.rate,
          }
        : item
    ));
  };

  const handleAttachmentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!business?.id) {
      setAttachmentError("Business profile not loaded. Please login again.");
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingAttachment(true);
    setAttachmentError(null);

    const extension = file.name.includes(".") ? file.name.split(".").pop() : "bin";
    const safeBaseName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "-");
    const filePath = `${business.id}/${formData.jobId}/${Date.now()}-${safeBaseName}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("job-images")
      .upload(filePath, file, { upsert: true });

    setUploadingAttachment(false);
    event.target.value = "";

    if (uploadError) {
      console.error("Error uploading attachment:", uploadError);
      setAttachmentError(
        uploadError.message.includes("Bucket not found")
          ? "Storage bucket 'job-images' not found. Run supabase/create_job_images_bucket.sql first."
          : `Upload failed: ${uploadError.message}`
      );
      return;
    }

    setUploadedAttachmentPath(filePath);
    await resolveAttachmentUrl(filePath);
  };

  const handleSave = async () => {
    if (!business?.id) {
      alert("Business profile not loaded. Please login again.");
      return;
    }

    if (!formData.customerName.trim() || !formData.mobileNumber.trim()) {
      alert("Customer name and mobile number are required.");
      return;
    }

    setSaving(true);

    const payload = {
      business_id: business.id,
      external_job_id: formData.jobId,
      title: formData.problemReported || formData.productCategory || "Service Job",
      status: formData.jobStatus,
      job_date: formData.jobDate || null,
      customer_name: formData.customerName,
      mobile_number: formData.mobileNumber,
      alternate_mobile: formData.alternateMobile || null,
      address: formData.address || null,
      city: formData.city || null,
      pincode: formData.pincode || null,
      product_category: formData.productCategory || null,
      brand: formData.brand || null,
      model_name: formData.modelName || null,
      serial_number: formData.serialNumber || null,
      warranty_status: formData.warrantyStatus,
      purchase_date: formData.purchaseDate || null,
      problem_reported: formData.problemReported || null,
      initial_diagnosis: formData.initialDiagnosis || null,
      technician_assigned: formData.technicianAssigned || null,
      priority_level: formData.priorityLevel || null,
      service_type: formData.serviceType || null,
      labor_charges: Number(formData.laborCharges || 0),
      estimate_approval_status: formData.estimateApprovalStatus || null,
      workbench_start_date: formData.workbenchStartDate || null,
      repair_completion_date: formData.repairCompletionDate || null,
      ready_to_deliver_date: formData.readyToDeliverDate || null,
      payment_status: formData.paymentStatus || null,
      payment_mode: formData.paymentMode || null,
      paid_amount: Number(formData.paidAmount || 0),
      internal_notes: formData.internalNotes || null,
      customer_remarks: formData.customerRemarks || null,
      image_path: uploadedAttachmentPath || null,
      created_by: profile?.id || null,
    };

    const query = existingJobId
      ? supabase.from("jobs").update(payload).eq("id", existingJobId).select("id").single()
      : supabase.from("jobs").insert(payload).select("id").single();

    const { data, error } = await query;

    setSaving(false);

    if (error) {
      console.error("Error saving job:", error);
      alert(`Failed to save job: ${error.message}`);
      return;
    }

    const savedJobId = existingJobId || data?.id;
    const usedItems = stockItemsUsed.filter((item) => item.stockItemId && item.qtyUsed > 0);

    if (savedJobId) {
      const { data: previousParts, error: previousPartsError } = await supabase
        .from("job_parts")
        .select("product_id, qty_used")
        .eq("business_id", business.id)
        .eq("job_id", savedJobId);

      if (previousPartsError) {
        console.error("Error loading previous job parts:", previousPartsError);
        alert(`Job saved, but stock reconciliation failed: ${previousPartsError.message}`);
      } else {
        const previousByProduct = new Map<string, number>();
        for (const row of previousParts || []) {
          if (!row.product_id) continue;
          previousByProduct.set(
            row.product_id,
            (previousByProduct.get(row.product_id) || 0) + Number(row.qty_used || 0)
          );
        }

        const nextByProduct = new Map<string, number>();
        for (const item of usedItems) {
          nextByProduct.set(
            item.stockItemId,
            (nextByProduct.get(item.stockItemId) || 0) + Number(item.qtyUsed || 0)
          );
        }

        const allProductIds = Array.from(new Set([...previousByProduct.keys(), ...nextByProduct.keys()]));
        if (allProductIds.length > 0) {
          const { data: currentProducts, error: currentProductsError } = await supabase
            .from("products")
            .select("id, quantity")
            .in("id", allProductIds);

          if (currentProductsError) {
            console.error("Error loading current stock quantities:", currentProductsError);
            alert(`Job saved, but stock update failed: ${currentProductsError.message}`);
          } else {
            const quantityMap = new Map((currentProducts || []).map((p: any) => [p.id, Number(p.quantity || 0)]));
            for (const productId of allProductIds) {
              const previousQty = previousByProduct.get(productId) || 0;
              const nextQty = nextByProduct.get(productId) || 0;
              const deltaQty = nextQty - previousQty;

              if (deltaQty === 0) continue;

              const currentQty = quantityMap.get(productId) ?? 0;
              const updatedQty = Math.max(0, currentQty - deltaQty);

              const { error: updateStockError } = await supabase
                .from("products")
                .update({ quantity: updatedQty })
                .eq("id", productId);

              if (updateStockError) {
                console.error("Error updating product stock:", updateStockError);
              }
            }
          }
        }
      }

      const { error: deletePartsError } = await supabase
        .from("job_parts")
        .delete()
        .eq("business_id", business.id)
        .eq("job_id", savedJobId);

      if (deletePartsError) {
        console.error("Error clearing existing job parts:", deletePartsError);
        alert(`Job saved, but failed to update used parts: ${deletePartsError.message}`);
      } else if (usedItems.length > 0) {
        const rows = usedItems.map((item) => ({
          business_id: business.id,
          job_id: savedJobId,
          product_id: item.stockItemId,
          part_name: item.itemName,
          qty_used: Number(item.qtyUsed || 0),
          rate: Number(item.rate || 0),
        }));

        const { error: insertPartsError } = await supabase
          .from("job_parts")
          .insert(rows);

        if (insertPartsError) {
          console.error("Error saving job parts:", insertPartsError);
          alert(`Job saved, but failed to save used parts: ${insertPartsError.message}`);
        }
      }
    }

    if (savedJobId) {
      setExistingJobId(savedJobId);
    }

    alert("Job saved successfully!");
    onSaved?.();
    onClose();
  };

  const handleCallCustomer = () => {
    window.location.href = `tel:${formData.mobileNumber}`;
  };

  const generateServicePdf = (mode: "estimate" | "invoice") => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const left = 14;
    const right = pageWidth - 14;
    const descX = left + 12;
    const qtyX = right - 62;
    const rateX = right - 36;
    const amountX = right - 2;
    const maxDescWidth = qtyX - descX - 10;
    let y = 14;

    const formatAmount = (value: number) =>
      Number(value || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    const formatDate = (value?: string) => {
      if (!value) return new Date().toLocaleDateString("en-IN");
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return value;
      return parsed.toLocaleDateString("en-IN");
    };

    const lineItems = [
      {
        description: "Labor Charges",
        qty: 1,
        rate: Number(formData.laborCharges || 0),
        total: Number(formData.laborCharges || 0),
      },
      ...stockItemsUsed
        .filter((item) => item.stockItemId && item.qtyUsed > 0)
        .map((item) => ({
          description: item.itemName || "Part",
          qty: Number(item.qtyUsed || 0),
          rate: Number(item.rate || 0),
          total: Number(item.total || 0),
        })),
    ];

    const documentTitle = mode === "estimate" ? "SERVICE ESTIMATE" : "SERVICE INVOICE";
    const detailsTitle = mode === "estimate" ? "Estimate Details" : "Invoice Details";
    const numberLabel = mode === "estimate" ? "Estimate No" : "Invoice No";
    const dateLabel = mode === "estimate" ? "Estimate Date" : "Invoice Date";

    const drawHeaderBlock = () => {
      pdf.setDrawColor(210, 214, 220);
      pdf.setLineWidth(0.4);
      pdf.roundedRect(left, y, right - left, 30, 2, 2);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.text(business?.name || "Service Center", left + 3, y + 9);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text(documentTitle, left + 3, y + 16);
      pdf.text(`Generated By: ${profile?.login_id || "Admin"}`, left + 3, y + 22);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text(detailsTitle, right - 3, y + 7, { align: "right" });
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text(`${numberLabel}: ${formData.jobId}`, right - 3, y + 13, { align: "right" });
      pdf.text(`${dateLabel}: ${formatDate(formData.jobDate)}`, right - 3, y + 19, { align: "right" });
      pdf.text(`Status: ${formData.jobStatus}`, right - 3, y + 25, { align: "right" });

      y += 38;
    };

    const drawCustomerSection = () => {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text(mode === "estimate" ? "Estimate For" : "Bill To", left, y);
      y += 6;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text(`Customer: ${formData.customerName || "-"}`, left, y);
      y += 5;
      pdf.text(`Mobile: ${formData.mobileNumber || "-"}`, left, y);
      y += 5;
      pdf.text(`Alternate Mobile: ${formData.alternateMobile || "-"}`, left, y);
      y += 5;
      pdf.text(`Address: ${formData.address || "-"}`, left, y);
      y += 5;
      pdf.text(`City/Pincode: ${formData.city || "-"} / ${formData.pincode || "-"}`, left, y);
      y += 9;

      pdf.setDrawColor(225, 228, 232);
      pdf.line(left, y, right, y);
      y += 7;
    };

    const drawTableHeader = () => {
      pdf.setFillColor(245, 247, 250);
      pdf.rect(left, y, right - left, 8, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text("#", left + 2, y + 5.4);
      pdf.text("Description", descX, y + 5.4);
      pdf.text("Qty", qtyX, y + 5.4, { align: "right" });
      pdf.text("Rate (INR)", rateX, y + 5.4, { align: "right" });
      pdf.text("Amount (INR)", amountX, y + 5.4, { align: "right" });
      y += 8;
    };

    const ensurePageSpace = (requiredHeight: number) => {
      if (y + requiredHeight <= pageHeight - 25) return;
      pdf.addPage();
      y = 14;
      drawHeaderBlock();
      drawTableHeader();
    };

    drawHeaderBlock();
    drawCustomerSection();
    drawTableHeader();

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);

    lineItems.forEach((item, index) => {
      const wrappedDescription = pdf.splitTextToSize(item.description, maxDescWidth) as string[];
      const rowHeight = Math.max(8, wrappedDescription.length * 5 + 2);
      ensurePageSpace(rowHeight);

      pdf.text(String(index + 1), left + 2, y + 5.4);
      pdf.text(wrappedDescription, descX, y + 5.4);
      pdf.text(String(item.qty), qtyX, y + 5.4, { align: "right" });
      pdf.text(formatAmount(item.rate), rateX, y + 5.4, { align: "right" });
      pdf.text(formatAmount(item.total), amountX, y + 5.4, { align: "right" });

      y += rowHeight;
      pdf.setDrawColor(240, 240, 240);
      pdf.line(left, y, right, y);
    });

    y += 6;
    ensurePageSpace(42);

    const summaryStartX = right - 90;
    pdf.setDrawColor(220, 224, 229);
    pdf.roundedRect(summaryStartX, y, 90, 36, 2, 2);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text("Labor (INR)", summaryStartX + 4, y + 7);
    pdf.text(formatAmount(formData.laborCharges), right - 3, y + 7, { align: "right" });
    pdf.text("Spare Parts (INR)", summaryStartX + 4, y + 14);
    pdf.text(formatAmount(totalSpareCost), right - 3, y + 14, { align: "right" });

    if (mode === "estimate") {
      pdf.setFont("helvetica", "bold");
      pdf.text("Estimated Total (INR)", summaryStartX + 4, y + 23);
      pdf.text(formatAmount(estimatedAmount), right - 3, y + 23, { align: "right" });
      pdf.setFont("helvetica", "normal");
      pdf.text(`Approval: ${formData.estimateApprovalStatus || "Pending"}`, summaryStartX + 4, y + 30);
    } else {
      pdf.text("Paid (INR)", summaryStartX + 4, y + 23);
      pdf.text(formatAmount(formData.paidAmount), right - 3, y + 23, { align: "right" });
      pdf.setFont("helvetica", "bold");
      pdf.text("Balance (INR)", summaryStartX + 4, y + 30);
      pdf.text(formatAmount(balanceAmount), right - 3, y + 30, { align: "right" });
    }

    y += 44;
    ensurePageSpace(28);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text("Notes", left, y);
    y += 5;
    pdf.setFont("helvetica", "normal");
    pdf.text(
      mode === "estimate"
        ? "This is a preliminary estimate. Final bill may vary after complete diagnosis and repair."
        : (formData.customerRemarks || formData.internalNotes || "Thank you for your business."),
      left,
      y,
      { maxWidth: right - left }
    );

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text("Authorized Signature", right - 3, pageHeight - 12, { align: "right" });

    pdf.save(`${mode}-${formData.jobId}.pdf`);
  };

  const handleGenerateEstimate = () => {
    generateServicePdf("estimate");
  };

  const handleGenerateInvoice = () => {
    if (!["Delivered", "Completed"].includes(formData.jobStatus)) {
      alert("Generate bill after job is Delivered or Completed.");
      return;
    }
    generateServicePdf("invoice");
  };

  const handleMarkDelivered = () => {
    if (confirm("Mark this job as delivered?")) {
      setFormData(prev => ({ ...prev, jobStatus: "Delivered" }));
      alert("Status set to Delivered. Tap Save to persist.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#628F97] text-white p-4 flex items-center justify-between shadow-md z-10">
          <h2>Job Details - {formData.jobId}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-6">
          {/* 1. Job Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-[#4D4D4D] mb-4">1. Job Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-[#717182] mb-2">Job ID</label>
                <input
                  type="text"
                  name="jobId"
                  value={formData.jobId}
                  disabled
                  className="w-full px-4 py-3 bg-gray-100 text-[#717182] rounded-lg border border-gray-200"
                />
              </div>
              <div>
                <label className="block text-sm text-[#717182] mb-2">Job Date</label>
                <input
                  type="date"
                  name="jobDate"
                  value={formData.jobDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-[#717182] mb-2">Job Status</label>
                <select
                  name="jobStatus"
                  value={formData.jobStatus}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none"
                >
                  {JOB_STATUSES.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 2. Customer Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-[#4D4D4D] mb-4">2. Customer Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#717182] mb-2">Customer Name *</label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-[#717182] mb-2">Mobile Number *</label>
                <input
                  type="tel"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-[#717182] mb-2">Alternate Mobile Number</label>
                <input
                  type="tel"
                  name="alternateMobile"
                  value={formData.alternateMobile}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-[#717182] mb-2">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-[#717182] mb-2">Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-4 py-3 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-[#717182] mb-2">Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 3. Product Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-[#4D4D4D] mb-4">3. Product Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#717182] mb-2">Product Category *</label>
                <select
                  name="productCategory"
                  value={formData.productCategory}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none"
                >
                  <option value="">Select category</option>
                  <option value="TV">TV</option>
                  <option value="Mobile">Mobile</option>
                  <option value="AC">AC</option>
                  <option value="Washing Machine">Washing Machine</option>
                  <option value="Refrigerator">Refrigerator</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#717182] mb-2">Brand</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  placeholder="e.g., Samsung, LG, Sony"
                  className="w-full px-4 py-3 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-[#717182] mb-2">Model Name / Number</label>
                <input
                  type="text"
                  name="modelName"
                  value={formData.modelName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-[#717182] mb-2">Serial Number</label>
                <input
                  type="text"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-[#717182] mb-2">Warranty Status</label>
                <select
                  name="warrantyStatus"
                  value={formData.warrantyStatus}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#717182] mb-2">Purchase Date</label>
                <input
                  type="date"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 4. Problem & Diagnosis */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-[#4D4D4D] mb-4">4. Problem & Diagnosis</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#717182] mb-2">Problem Reported by Customer *</label>
                <textarea
                  name="problemReported"
                  value={formData.problemReported}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Describe the issue reported by customer"
                  className="w-full px-4 py-3 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-[#717182] mb-2">Initial Diagnosis</label>
                <textarea
                  name="initialDiagnosis"
                  value={formData.initialDiagnosis}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Initial diagnosis by technician"
                  className="w-full px-4 py-3 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#717182] mb-2">Technician Assigned</label>
                  <input
                    type="text"
                    name="technicianAssigned"
                    value={formData.technicianAssigned}
                    onChange={handleInputChange}
                    placeholder="Technician name"
                    className="w-full px-4 py-3 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#717182] mb-2">Priority Level</label>
                  <select
                    name="priorityLevel"
                    value={formData.priorityLevel}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Service & Repair Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-[#4D4D4D] mb-4">5. Service & Repair Details</h3>
            <div className="mb-4">
              <label className="block text-sm text-[#717182] mb-2">Service Type</label>
              <select
                name="serviceType"
                value={formData.serviceType}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none"
              >
                <option value="Repair">Repair</option>
                <option value="Installation">Installation</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>

            {/* Stock Items Used */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[#4D4D4D]">Stock Items Used</h4>
                <button
                  onClick={handleAddStockItem}
                  className="flex items-center gap-2 px-3 py-2 bg-[#B9CE18] text-white rounded-lg hover:bg-[#a8bc14] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">Add Item</span>
                </button>
              </div>

              <div className="space-y-3">
                {stockItemsUsed.map((item, index) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3 items-end">
                        <div className="md:col-span-5">
                        <label className="block text-xs text-[#717182] mb-1">Stock Item</label>
                        <select
                          value={item.stockItemId}
                          onChange={(e) => handleStockItemChange(item.id, e.target.value)}
                          className="w-full px-3 py-2 bg-white text-[#4D4D4D] rounded border border-gray-200 focus:border-[#B9CE18] focus:outline-none text-sm"
                        >
                          <option value="">Select item</option>
                          {availableStockItems.map(stock => (
                            <option key={stock.id} value={stock.id}>
                              {stock.name} (Avail: {stock.quantity})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs text-[#717182] mb-1">Qty Used</label>
                        <input
                          type="number"
                          value={item.qtyUsed}
                          onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                          min="0"
                          max={item.availableQty}
                          className="w-full px-3 py-2 bg-white text-[#4D4D4D] rounded border border-gray-200 focus:border-[#B9CE18] focus:outline-none text-sm"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs text-[#717182] mb-1">Rate (₹)</label>
                        <input
                          type="number"
                          value={item.rate}
                          disabled
                          className="w-full px-3 py-2 bg-gray-100 text-[#717182] rounded border border-gray-200 text-sm"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs text-[#717182] mb-1">Total (₹)</label>
                        <input
                          type="number"
                          value={item.total}
                          disabled
                          className="w-full px-3 py-2 bg-gray-100 text-[#717182] rounded border border-gray-200 text-sm"
                        />
                      </div>
                      <div className="md:col-span-1 flex md:justify-center">
                        <button
                          onClick={() => handleRemoveStockItem(item.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                          aria-label={`Remove stock item ${index + 1}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {item.availableQty > 0 && (
                      <p className="text-xs text-[#717182]">Available: {item.availableQty} units</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 6. Charges & Estimate */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-[#4D4D4D] mb-4">6. Charges & Estimate</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#717182] mb-2">Labor Charges (₹)</label>
                <input
                  type="number"
                  name="laborCharges"
                  value={formData.laborCharges}
                  onChange={(e) => setFormData(prev => ({ ...prev, laborCharges: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-[#717182] mb-2">Total Spare Cost (₹)</label>
                <input
                  type="number"
                  value={totalSpareCost}
                  disabled
                  className="w-full px-4 py-3 bg-gray-100 text-[#717182] rounded-lg border border-gray-200"
                />
              </div>
              <div>
                <label className="block text-sm text-[#717182] mb-2">Estimated Amount (₹)</label>
                <input
                  type="number"
                  value={estimatedAmount}
                  disabled
                  className="w-full px-4 py-3 bg-[#B9CE18]/10 text-[#4D4D4D] rounded-lg border border-[#B9CE18]"
                />
              </div>
              <div>
                <label className="block text-sm text-[#717182] mb-2">Estimate Approval Status</label>
                <select
                  name="estimateApprovalStatus"
                  value={formData.estimateApprovalStatus}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none"
                >
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* 7. Work Progress */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-[#4D4D4D] mb-4">7. Work Progress</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-[#717182] mb-2">Workbench Start Date</label>
                <input
                  type="date"
                  name="workbenchStartDate"
                  value={formData.workbenchStartDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-[#717182] mb-2">Repair Completion Date</label>
                <input
                  type="date"
                  name="repairCompletionDate"
                  value={formData.repairCompletionDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-[#717182] mb-2">Ready to Deliver Date</label>
                <input
                  type="date"
                  name="readyToDeliverDate"
                  value={formData.readyToDeliverDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 8. Payment Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-[#4D4D4D] mb-4">8. Payment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#717182] mb-2">Payment Status</label>
                <select
                  name="paymentStatus"
                  value={formData.paymentStatus}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none"
                >
                  <option value="Unpaid">Unpaid</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#717182] mb-2">Payment Mode</label>
                <select
                  name="paymentMode"
                  value={formData.paymentMode}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#717182] mb-2">Paid Amount (₹)</label>
                <input
                  type="number"
                  name="paidAmount"
                  value={formData.paidAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, paidAmount: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-[#717182] mb-2">Balance Amount (₹)</label>
                <input
                  type="number"
                  value={balanceAmount}
                  disabled
                  className="w-full px-4 py-3 bg-red-50 text-red-700 rounded-lg border border-red-200"
                />
              </div>
            </div>
          </div>

          {/* 9. Attachments */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-[#4D4D4D] mb-4">9. Attachments</h3>
            <input
              id="job-camera-upload"
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleAttachmentUpload}
            />
            <input
              id="job-gallery-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAttachmentUpload}
            />
            <input
              id="job-problem-photo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAttachmentUpload}
            />
            <input
              id="job-doc-upload"
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              className="hidden"
              onChange={handleAttachmentUpload}
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label htmlFor="job-camera-upload" className="cursor-pointer flex flex-col items-center gap-2 px-4 py-4 bg-white text-[#628F97] rounded-lg border border-[#628F97] hover:bg-[#628F97]/5 transition-colors">
                <Camera className="w-6 h-6" />
                <span className="text-sm">Camera</span>
              </label>
              <label htmlFor="job-gallery-upload" className="cursor-pointer flex flex-col items-center gap-2 px-4 py-4 bg-white text-[#628F97] rounded-lg border border-[#628F97] hover:bg-[#628F97]/5 transition-colors">
                <Image className="w-6 h-6" />
                <span className="text-sm">Gallery</span>
              </label>
              <label htmlFor="job-problem-photo-upload" className="cursor-pointer flex flex-col items-center gap-2 px-4 py-4 bg-white text-[#628F97] rounded-lg border border-[#628F97] hover:bg-[#628F97]/5 transition-colors">
                <FileText className="w-6 h-6" />
                <span className="text-sm">Problem Photo</span>
              </label>
              <label htmlFor="job-doc-upload" className="cursor-pointer flex flex-col items-center gap-2 px-4 py-4 bg-white text-[#628F97] rounded-lg border border-[#628F97] hover:bg-[#628F97]/5 transition-colors">
                <FileText className="w-6 h-6" />
                <span className="text-sm">Documents</span>
              </label>
            </div>
            {uploadingAttachment && (
              <p className="text-sm text-[#717182] mt-3">Uploading attachment...</p>
            )}
            {attachmentError && (
              <p className="text-sm text-red-600 mt-3">{attachmentError}</p>
            )}
            {uploadedAttachmentPath && (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="min-w-0">
                  <p className="text-sm text-[#4D4D4D] truncate">Uploaded: {uploadedAttachmentPath.split("/").pop()}</p>
                  {uploadedAttachmentUrl && (
                    <a
                      href={uploadedAttachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#628F97] hover:underline"
                    >
                      View uploaded file
                    </a>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUploadedAttachmentPath("");
                    setUploadedAttachmentUrl("");
                    setAttachmentError(null);
                  }}
                  className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* 10. Notes */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-[#4D4D4D] mb-4">10. Notes</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#717182] mb-2">Internal Notes (Admin / Technician)</label>
                <textarea
                  name="internalNotes"
                  value={formData.internalNotes}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Private notes for internal use"
                  className="w-full px-4 py-3 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-[#717182] mb-2">Customer Remarks</label>
                <textarea
                  name="customerRemarks"
                  value={formData.customerRemarks}
                  onChange={handleInputChange}
                  rows={2}
                  placeholder="Additional remarks from customer"
                  className="w-full px-4 py-3 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 11. Action Buttons (Sticky Footer) */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-3">
            <button
              onClick={handleCallCustomer}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-white text-[#628F97] rounded-lg border border-[#628F97] hover:bg-[#628F97]/5 transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span className="text-sm">Call</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-[#B9CE18] text-white rounded-lg hover:bg-[#a8bc14] transition-colors"
            >
              <Save className="w-4 h-4" />
              <span className="text-sm">{saving ? "Saving..." : "Save"}</span>
            </button>
            <button
              onClick={handleGenerateEstimate}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-white text-[#628F97] rounded-lg border border-[#628F97] hover:bg-[#628F97]/5 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span className="text-sm">Estimate</span>
            </button>
            <button
              onClick={handleGenerateInvoice}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-white text-[#628F97] rounded-lg border border-[#628F97] hover:bg-[#628F97]/5 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span className="text-sm">Invoice</span>
            </button>
            <button
              onClick={handleMarkDelivered}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Truck className="w-4 h-4" />
              <span className="text-sm">Deliver</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
