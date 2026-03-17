import { useState, useEffect } from "react";
import { X, Phone, Save, Camera, Image, Plus, Trash2, FileText, Truck } from "lucide-react";

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

export function JobDetailForm({ job, onClose, jobId }: JobDetailFormProps) {
  // Mock stock items from Manage Stock
  const availableStockItems = [
    { id: "1", name: "Capacitor 10uF", quantity: 45, rate: 25 },
    { id: "2", name: "Resistor 1K Ohm", quantity: 120, rate: 5 },
    { id: "3", name: "LED Display Panel", quantity: 8, rate: 450 },
    { id: "4", name: "Temperature Sensor", quantity: 15, rate: 320 },
    { id: "5", name: "Motor Belt", quantity: 22, rate: 180 },
    { id: "6", name: "Compressor", quantity: 3, rate: 2500 },
    { id: "7", name: "PCB Board", quantity: 12, rate: 850 },
  ];

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
    }
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

  const handleSave = () => {
    console.log("Saving job:", formData);
    console.log("Stock items used:", stockItemsUsed);
    // TODO: Update stock quantities in backend
    alert("Job saved successfully! Stock updated.");
    onClose();
  };

  const handleCallCustomer = () => {
    window.location.href = `tel:${formData.mobileNumber}`;
  };

  const handleGenerateEstimate = () => {
    alert("Estimate PDF generated!");
  };

  const handleGenerateInvoice = () => {
    alert("Invoice PDF generated!");
  };

  const handleMarkDelivered = () => {
    if (confirm("Mark this job as delivered?")) {
      setFormData(prev => ({ ...prev, jobStatus: "Delivered" }));
      alert("Job marked as delivered!");
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
                  <option value="Inbox">Inbox</option>
                  <option value="Not Reviewed">Not Reviewed</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Estimate Pending">Estimate Pending</option>
                  <option value="Estimate Approved">Estimate Approved</option>
                  <option value="On Workbench">On Workbench</option>
                  <option value="Ready to Deliver">Ready to Deliver</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Most Urgent">Most Urgent</option>
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
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
                      <div className="md:col-span-2">
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
                      <div>
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
                      <div>
                        <label className="block text-xs text-[#717182] mb-1">Rate (₹)</label>
                        <input
                          type="number"
                          value={item.rate}
                          disabled
                          className="w-full px-3 py-2 bg-gray-100 text-[#717182] rounded border border-gray-200 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#717182] mb-1">Total (₹)</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={item.total}
                            disabled
                            className="flex-1 px-3 py-2 bg-gray-100 text-[#717182] rounded border border-gray-200 text-sm"
                          />
                          <button
                            onClick={() => handleRemoveStockItem(item.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button className="flex flex-col items-center gap-2 px-4 py-4 bg-white text-[#628F97] rounded-lg border border-[#628F97] hover:bg-[#628F97]/5 transition-colors">
                <Camera className="w-6 h-6" />
                <span className="text-sm">Camera</span>
              </button>
              <button className="flex flex-col items-center gap-2 px-4 py-4 bg-white text-[#628F97] rounded-lg border border-[#628F97] hover:bg-[#628F97]/5 transition-colors">
                <Image className="w-6 h-6" />
                <span className="text-sm">Gallery</span>
              </button>
              <button className="flex flex-col items-center gap-2 px-4 py-4 bg-white text-[#628F97] rounded-lg border border-[#628F97] hover:bg-[#628F97]/5 transition-colors">
                <FileText className="w-6 h-6" />
                <span className="text-sm">Problem Photo</span>
              </button>
              <button className="flex flex-col items-center gap-2 px-4 py-4 bg-white text-[#628F97] rounded-lg border border-[#628F97] hover:bg-[#628F97]/5 transition-colors">
                <FileText className="w-6 h-6" />
                <span className="text-sm">Documents</span>
              </button>
            </div>
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
              className="flex items-center justify-center gap-2 px-4 py-3 bg-[#B9CE18] text-white rounded-lg hover:bg-[#a8bc14] transition-colors"
            >
              <Save className="w-4 h-4" />
              <span className="text-sm">Save</span>
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
