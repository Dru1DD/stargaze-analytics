import React, { useState, useEffect, useRef } from "react";

export const CustomSelect: React.FC<{
  options: { value: number; label: string }[];
  value: number;
  onChange: (value: number) => void;
}> = ({ options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => setIsOpen((prev) => !prev);

  const handleSelect = (selectedValue: number) => {
    onChange(selectedValue);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev === null ? 0 : Math.min(prev + 1, options.length - 1)
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev === null ? options.length - 1 : Math.max(prev - 1, 0)
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex !== null)
          handleSelect(options[highlightedIndex].value);
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  const closeDropdownOnClickOutside = (e: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(e.target as Node)
    ) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", closeDropdownOnClickOutside);
    return () =>
      document.removeEventListener("mousedown", closeDropdownOnClickOutside);
  }, []);

  return (
    <div
      className="relative w-full max-w-xs my-4"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      ref={dropdownRef}
    >
      <div
        className="gray-color border-class text-white px-4 py-2 rounded cursor-pointer flex justify-between items-center"
        onClick={toggleDropdown}
      >
        <span>
          {options.find((option) => option.value === value)?.label ||
            "Select an option"}
        </span>
        <span className="ml-2 text-gray-400">{isOpen ? "▲" : "▼"}</span>
      </div>

      {isOpen && (
        <ul className="absolute z-50 gray-color text-white border-class  rounded shadow-md mt-2 w-full max-h-60 overflow-y-auto">
          {options.map((option, index) => (
            <li
              key={option.value}
              className={`px-4 py-2 cursor-pointer bg-gray-700 hover:bg-gray-600 ${
                value === option.value ? "font-bold" : ""
              }`}
              onMouseEnter={() => setHighlightedIndex(index)}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </li>
          ))}
          {options.length === 0 && (
            <li className="px-4 py-2 text-gray-400">No options available</li>
          )}
        </ul>
      )}
    </div>
  );
};
