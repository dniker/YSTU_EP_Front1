"use client";

import React, {useState, useRef, useEffect} from "react";
import sidebar from "@/styles/Sidebar.module.css";

interface SidebarProps {
    checkStudyPlan: () => void;
    disciplines: any[];
    selectedDiscipline: any;
    handleDragStart: (discipline: any) => void;
    hasStudyPlan: boolean;
    // handleTableDisciplineClick: (discipline: any) => void;
}

export const Sidebar = ({
                            checkStudyPlan,
                            disciplines,
                            selectedDiscipline,
                            handleDragStart,
                            hasStudyPlan,
                            // handleTableDisciplineClick,
                        }: SidebarProps) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [sortAscending, setSortAscending] = useState(true);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const [isResizing, setIsResizing] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(250);

    const toggleSortDirection = () => {
        setSortAscending(!sortAscending);
    };

    const startResizing = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing || !sidebarRef.current) return;

            const newWidth = e.clientX;
            if (newWidth > 200 && newWidth < 400) {
                setSidebarWidth(newWidth);
                sidebarRef.current.style.width = `${newWidth}px`;
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    const filteredDisciplines = disciplines
        .filter(discipline =>
            discipline.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();
            return sortAscending
                ? nameA.localeCompare(nameB)
                : nameB.localeCompare(nameA);
        });

    return (
        <aside
            className={sidebar.sidebar}
            ref={sidebarRef}
            style={{width: `${sidebarWidth}px`}}
        >
            <div
                className={sidebar["resize-handle"]}
                onMouseDown={startResizing}
            />
            {hasStudyPlan && (
                <button
                    className={sidebar.checkButton}
                    onClick={checkStudyPlan}
                >
                    Проверить карту учебного плана на наличие ошибок
                </button>
            )}

            <div className={sidebar.titleContainer}>
                <div className={sidebar.disciplineListTitle}>Дисциплины</div>
                <button
                    onClick={toggleSortDirection}
                    className={sidebar.sortButton}
                    title={sortAscending ? "Сортировка А-Я" : "Сортировка Я-А"}
                >
                    {sortAscending ? "А-Я" : "Я-А"}
                </button>
            </div>

            <div className={sidebar.searchContainer}>
                <input
                    type="text"
                    placeholder="Поиск дисциплин..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={sidebar.searchInput}
                />
            </div>

            <ul className={sidebar.disciplinesList}>
                {filteredDisciplines.map((discipline) => (
                    <li
                        key={discipline.id}
                        draggable
                        onDragStart={() => handleDragStart(discipline)}
                        // onDoubleClick={() => handleTableDisciplineClick(discipline)}
                        className={sidebar.draggableItem} // Убираем проверку selected
                    >
                        {discipline.name}
                    </li>
                ))}
            </ul>
        </aside>
    );
};
