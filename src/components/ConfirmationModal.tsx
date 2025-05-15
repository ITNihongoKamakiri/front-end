import React from 'react';
import '../styles/ConfirmationModal.css';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel
}) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content confirmation-modal">
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button className="close-button" onClick={onCancel}>×</button>
                </div>
                <div className="modal-body">
                    <p>{message}</p>
                </div>
                <div className="modal-footer">
                    <button className="cancel-button" onClick={onCancel}>Hủy</button>
                    <button className="delete-button" onClick={onConfirm}>Xóa</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;