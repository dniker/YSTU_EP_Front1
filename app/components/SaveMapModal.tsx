"use client";

import React from "react";
import modal from "@/styles/Modal.module.css";
import modalContent from "@/styles/ModalContent.module.css";

interface SaveMapModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => Promise<void>;
    onInfo: () => void;
    isLoading: boolean;
    error?: string | null;
}

export const SaveMapModal = ({
                                 isOpen,
                                 onClose,
                                 onSave,
                                 onInfo,
                                 isLoading,
                                 error
                             }: SaveMapModalProps) => {
    if (!isOpen) return null;

    const handleCloseClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClose();
    };

    return (
        <div className={modal["modal"]}>
            <div className={modalContent["modalContent"]} style={{ width: '500px' }}>
                <div className={modalContent["modalHeader"]}>
                    <h3>Сохранение карты учебного плана</h3>
                    <button onClick={handleCloseClick} className={modalContent.closeButton}>
                        ×
                    </button>
                </div>

                {error && <div className={modalContent.errorMessage}>{error}</div>}

                <div className={modalContent.contentContainer}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '20px' }}>
                        <button
                            className={modalContent.addButton}
                            onClick={onSave}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Сохранение...' : 'Сохранить'}
                        </button>
                        <button
                            className={modalContent.addButton}
                            onClick={onInfo}
                            style={{ backgroundColor: '#f1f1f1', color: '#333' }}
                        >
                            Инфо
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};