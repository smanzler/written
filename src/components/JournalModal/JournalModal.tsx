import { Modal } from "@mui/material";
import { JournalDates } from "../JournalDates";
import "./JournalModal.css";

interface Props {
  open: boolean;
  onClose: () => void;
}

const JournalModal = ({ open, onClose }: Props) => {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="modal-container">
        <JournalDates />
      </div>
    </Modal>
  );
};

export default JournalModal;
