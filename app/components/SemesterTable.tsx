"use client";

import React, {useState} from "react";
import table from "@/styles/Table.module.css";
import {ConfirmationModal} from "@/app/components/ConfirmationModal";
import {DisciplineItem} from "./DisciplineItem";
import {Discipline, TableRow} from "@/app/types";
import {red} from "next/dist/lib/picocolors";

interface SemesterTableProps {
    columns: number;
    rows: TableRow[];
    selectedDiscipline?: Discipline | null;
    handleDragStart: (
        discipline: Discipline,
        rowIndex?: number,
        colIndex?: number
    ) => void;
    handleDrop: (
        e: React.DragEvent<HTMLTableCellElement>,
        rowIndex: number,
        colIndex: number
    ) => void;
    handleDisciplineDelete: (
        discipline: Discipline,
        rowIndex: number,
        colIndex: number
    ) => void;
    calculateTotalCredits: () => number;
    calculateColumnCredits: () => number[];
    openCoreModal: () => void;
    handleDisciplineClick: (discipline: Discipline) => void;
    handleRowDelete: (rowIndex: number) => void;
}

export const SemesterTable = ({
                                  columns,
                                  rows,
                                  selectedDiscipline,
                                  handleDragStart,
                                  handleDrop,
                                  handleDisciplineDelete,
                                  calculateTotalCredits,
                                  calculateColumnCredits,
                                  openCoreModal,
                                  handleDisciplineClick,
                                  handleRowDelete,
                              }: SemesterTableProps) => {
    const [rowToDelete, setRowToDelete] = useState<number | null>(null);

    const confirmRowDelete = (rowIndex: number) => {
        setRowToDelete(rowIndex);
    };

    const handleConfirmDelete = () => {
        if (rowToDelete !== null) {
            handleRowDelete(rowToDelete);
            setRowToDelete(null);
        }
    };

    const handleCancelDelete = () => {
        setRowToDelete(null);
    };

    return (
        <>
            <table className={table["table"]}>
                <thead>
                <tr>
                    <th></th>
                    {Array.from({length: columns}, (_, i) => (
                        <th key={i}>Семестр {i + 1}</th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                        <td
                            className={table["row-name"]}
                            style={{background: row.color}}
                        >
                            {row.name}
                            <span
                                className={table["delete-row"]}
                                onClick={() => confirmRowDelete(rowIndex)}
                            >
                  &times;
                </span>
                        </td>
                        {row.data.map((cell, colIndex) => (
                            <td
                                key={colIndex}
                                style={{background: row.color}}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => handleDrop(e, rowIndex, colIndex)}
                            >
                                {cell.map((discipline, index) => (
                                    <DisciplineItem
                                        key={`${discipline.table_id}-${index}`}
                                        discipline={discipline}
                                        isActive={selectedDiscipline?.table_id === discipline.table_id}
                                        onClick={() => handleDisciplineClick(discipline)}
                                        onDragStart={() =>
                                            handleDragStart(discipline, rowIndex, colIndex)
                                        }
                                        deleteDisc={() =>
                                            handleDisciplineDelete(discipline, rowIndex, colIndex)
                                        }
                                    />
                                ))}
                            </td>
                        ))}
                    </tr>
                ))}
                <tr className={table.tr}>
                    <td>Общая сумма ЗЕ: {calculateTotalCredits()}</td>
                    {calculateColumnCredits().map((credits, colIndex) => (
                        <td key={colIndex}>{credits} ЗЕ</td>
                    ))}
                </tr>
                </tbody>
                <tfoot>
                <tr>
                    <td className={table.addRow} onClick={openCoreModal}>
                        <AddRowIcon/>
                    </td>
                </tr>
                </tfoot>
            </table>

            {rowToDelete !== null && (
                <ConfirmationModal
                    confirmationText="Вы действительно хотите удалить ядро?"
                    handleConfirmDelete={handleConfirmDelete}
                    handleCancelDelete={handleCancelDelete}
                />
            )}
        </>
    );
};

const AddRowIcon = () => (
    <svg
        width="30"
        height="30"
        viewBox="0 0 30 30"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M30 17.1429H17.1429V30H12.8571V17.1429H0V12.8571H12.8571V0H17.1429V12.8571H30V17.1429Z"
            fill="#343434"
        />
    </svg>
);
