import { useEffect, useState } from "react";
import { Search, Plus, Minus, Edit2, Trash2, PlusCircle } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

interface StockItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  rate: number;
}

export function ManageStock() {
  const { business } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    quantity: 0,
    rate: 0,
  });

  useEffect(() => {
    if (!business?.id) {
      setLoading(false);
      setErrorMessage("Business profile not loaded. Please login again.");
      return;
    }

    const fetchProducts = async () => {
      try {
        const { data: products, error } = await supabase
          .from("products")
          .select("id, name, quantity, rate")
          .eq("business_id", business.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching products:", error);
          setErrorMessage(error.message);
          setLoading(false);
          return;
        }

        setStockItems(
          (products || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            description: "",
            quantity: p.quantity,
            rate: p.rate,
          }))
        );
      } catch (err) {
        console.error("Error in fetchProducts:", err);
        setErrorMessage("Failed to load stock items");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [business?.id]);

  const filteredItems = stockItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleQuantityChange = async (id: string, delta: number) => {
    if (!business?.id) {
      setErrorMessage("Business profile not loaded. Please login again.");
      return;
    }

    const item = stockItems.find((i) => i.id === id);
    if (!item) return;

    const newQuantity = Math.max(0, item.quantity + delta);

    try {
      const { error } = await supabase
        .from("products")
        .update({ quantity: newQuantity })
        .eq("id", id);

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setStockItems((items) =>
        items.map((i) =>
          i.id === id ? { ...i, quantity: newQuantity } : i
        )
      );
    } catch (err) {
      console.error("Error updating quantity:", err);
      setErrorMessage("Failed to update quantity");
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      try {
        const { error } = await supabase.from("products").delete().eq("id", id);
        if (error) {
          setErrorMessage(error.message);
          return;
        }
        setStockItems((items) => items.filter((item) => item.id !== id));
      } catch (err) {
        console.error("Error deleting item:", err);
        setErrorMessage("Failed to delete stock item");
      }
    }
  };

  const handleAddItem = async () => {
    if (!business?.id || !newItem.name.trim() || newItem.rate <= 0) {
      setErrorMessage("Enter valid item name, rate and ensure business profile is loaded.");
      return;
    }

    try {
      const { error } = await supabase.from("products").insert({
        business_id: business.id,
        name: newItem.name,
        quantity: newItem.quantity,
        rate: newItem.rate,
      });

      if (error) {
        console.error("Error adding item:", error);
        setErrorMessage(error.message);
        return;
      }

      setErrorMessage(null);

      setNewItem({ name: "", description: "", quantity: 0, rate: 0 });
      setShowAddForm(false);

      // Refresh products
      const { data: products } = await supabase
        .from("products")
        .select("id, name, quantity, rate")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false });

      setStockItems(
        (products || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          description: "",
          quantity: p.quantity,
          rate: p.rate,
        }))
      );
    } catch (err) {
      console.error("Error in handleAddItem:", err);
      setErrorMessage("Failed to add stock item");
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[#4D4D4D] mb-2">Manage Stock</h1>
        <p className="text-[#717182]">Track and manage spare parts inventory</p>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#717182]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items..."
            className="w-full pl-12 pr-4 py-3 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none transition-colors"
          />
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <button
        onClick={() => setShowAddForm(!showAddForm)}
        className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-3 bg-[#B9CE18] text-white rounded-lg hover:bg-[#a8bc14] transition-colors"
      >
        <PlusCircle className="w-5 h-5" />
        <span>Add New Item</span>
      </button>

      {showAddForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 space-y-3">
          <h3 className="text-[#4D4D4D]">New Stock Item</h3>
          <input
            type="text"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            placeholder="Item name"
            className="w-full px-4 py-2 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none transition-colors"
          />
          <input
            type="text"
            value={newItem.description}
            onChange={(e) =>
              setNewItem({ ...newItem, description: e.target.value })
            }
            placeholder="Description"
            className="w-full px-4 py-2 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none transition-colors"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[#717182] mb-1">
                Quantity
              </label>
              <input
                type="number"
                value={newItem.quantity}
                onChange={(e) =>
                  setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-[#717182] mb-1">
                Rate (₹)
              </label>
              <input
                type="number"
                value={newItem.rate}
                onChange={(e) =>
                  setNewItem({ ...newItem, rate: parseInt(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none transition-colors"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAddItem}
              className="flex-1 px-4 py-2 bg-[#628F97] text-white rounded-lg hover:bg-[#537D85] transition-colors"
            >
              Add Item
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="flex-1 px-4 py-2 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-[#717182]">Loading...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#717182]">No items found</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-gray-200 p-4"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <h3 className="text-[#4D4D4D] mb-1">{item.name}</h3>
                  <p className="text-sm text-[#717182]">{item.description}</p>
                </div>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleQuantityChange(item.id, -1)}
                    className="p-2 bg-gray-100 text-[#4D4D4D] rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="text-center min-w-[60px]">
                    <p className="text-xl text-[#4D4D4D]">{item.quantity}</p>
                    <p className="text-xs text-[#717182]">in stock</p>
                  </div>
                  <button
                    onClick={() => handleQuantityChange(item.id, 1)}
                    className="p-2 bg-gray-100 text-[#4D4D4D] rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-right">
                  <p className="text-xl text-[#628F97]">₹{item.rate}</p>
                  <p className="text-xs text-[#717182]">per unit</p>
                </div>
              </div>

              {item.quantity < 10 && (
                <div className="mt-3 px-3 py-2 bg-orange-50 text-orange-700 rounded-lg text-sm">
                  ⚠️ Low stock alert
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
