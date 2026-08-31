import { useState } from "react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import api from "../../services/api";
import { useToast } from "../common/Toast";

export default function RatingModal({ ticket, isOpen, onClose }) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      showToast("Please select a rating", "error");
      return;
    }
    
    setLoading(true);
    try {
      await api.post(`/tickets/${ticket.id}/rate`, { rating, feedback });
      showToast("Thank you for your feedback!", "success");
      onClose();
    } catch (err) {
      showToast(err.response?.data?.detail || "Failed to submit rating", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rate Support Ticket">
      <form onSubmit={handleSubmit} className="space-y-6">
        <p className="text-sm text-gray-400">
          How would you rate the support you received for "{ticket.subject}"?
        </p>

        <div className="flex justify-center space-x-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`text-4xl transition-colors ${
                star <= rating ? "text-yellow-400" : "text-gray-600 hover:text-yellow-200"
              }`}
            >
              ★
            </button>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Feedback (Optional)
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full rounded-lg border border-surface-border bg-surface-bg p-3 text-sm text-white focus:border-brand-primary focus:outline-none"
            rows={3}
            placeholder="Tell us about your experience..."
          />
        </div>

        <div className="flex justify-end space-x-3">
          <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || rating === 0}>
            {loading ? "Submitting..." : "Submit Rating"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
