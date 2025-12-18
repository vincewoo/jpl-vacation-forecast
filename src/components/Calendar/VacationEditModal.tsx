import React, { useState, useMemo, useEffect } from 'react';
import { PlannedVacation, WorkSchedule } from '../../types';
import { calculateVacationHoursForRange } from '../../utils/workScheduleUtils';
import { parseDate } from '../../utils/dateUtils';

interface VacationEditModalProps {
  vacation: PlannedVacation | null;
  isOpen: boolean;
  workSchedule: WorkSchedule;
  onSave: (id: string, updates: Partial<PlannedVacation>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  canAffordVacation: (vacation: Omit<PlannedVacation, 'id'>) => {
    canAfford: boolean;
    projectedBalance: number;
  };
}

const VacationEditModal: React.FC<VacationEditModalProps> = ({
  vacation,
  isOpen,
  workSchedule,
  onSave,
  onDelete,
  onClose,
  canAffordVacation,
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Initialize form fields when vacation changes
  useEffect(() => {
    if (vacation) {
      setStartDate(vacation.startDate);
      setEndDate(vacation.endDate);
      setDescription(vacation.description || '');
      setError('');
      setShowDeleteConfirm(false);
    }
  }, [vacation]);

  const hours = useMemo(() => {
    if (!startDate || !endDate) return 0;
    try {
      return calculateVacationHoursForRange(
        parseDate(startDate),
        parseDate(endDate),
        workSchedule
      );
    } catch {
      return 0;
    }
  }, [startDate, endDate, workSchedule]);

  const handleSave = () => {
    if (!vacation) return;

    // Validate dates
    if (!startDate || !endDate) {
      setError('Both start and end dates are required');
      return;
    }

    if (parseDate(endDate) < parseDate(startDate)) {
      setError('End date must be after start date');
      return;
    }

    // Check affordability
    const { canAfford, projectedBalance } = canAffordVacation({
      startDate,
      endDate,
      hours,
    });

    if (!canAfford) {
      setError(
        `Cannot afford this change. Need ${hours}h, will have ${projectedBalance.toFixed(
          2
        )}h`
      );
      return;
    }

    // Save changes
    onSave(vacation.id, {
      startDate,
      endDate,
      hours,
      description: description.trim() || undefined,
    });

    onClose();
  };

  const handleDelete = () => {
    if (!vacation) return;

    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    onDelete(vacation.id);
    onClose();
  };

  const handleClose = () => {
    setShowDeleteConfirm(false);
    onClose();
  };

  if (!isOpen || !vacation) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Edit Vacation</h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <div className="form-group">
            <label htmlFor="edit-start-date">Start Date</label>
            <input
              type="date"
              id="edit-start-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-end-date">End Date</label>
            <input
              type="date"
              id="edit-end-date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-description">Description (optional)</label>
            <input
              type="text"
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Summer vacation"
            />
          </div>

          <div className="hours-estimate">
            <strong>Hours needed:</strong> {hours.toFixed(2)}
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button
              type="button"
              onClick={handleDelete}
              className="delete-button"
            >
              {showDeleteConfirm ? 'Confirm Delete' : 'Delete'}
            </button>
            <div className="right-actions">
              <button
                type="button"
                onClick={handleClose}
                className="cancel-button"
              >
                Cancel
              </button>
              <button type="submit" className="save-button">
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VacationEditModal;
