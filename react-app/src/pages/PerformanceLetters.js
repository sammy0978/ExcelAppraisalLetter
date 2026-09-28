import React, { useMemo, useRef, useState } from "react";
import html2pdf from "html2pdf.js";
import "./PerformanceLetters.css";

const initialEmployees = [
  {
    id: "EMP001",
    performanceId: "PERF001",
    name: "Amit Sharma",
    email: "amit.sharma@company.com",
    department: "Engineering",
    designation: "Software Engineer",
    hike: "10%",
    performanceBonus: 0,
    letterType: "Hike Letter",
    status: "Pending",
  },
  {
    id: "EMP002",
    performanceId: "PERF002",
    name: "Priya Patel",
    email: "priya.patel@company.com",
    department: "Finance",
    designation: "Senior Developer",
    hike: "0%",
    performanceBonus: 25000,
    letterType: "Performance Bonus Letter",
    status: "Pending",
  },
  {
    id: "EMP003",
    performanceId: "PERF003",
    name: "Rohan Das",
    email: "rohan.das@company.com",
    department: "Sales",
    designation: "Team Lead",
    hike: "8%",
    performanceBonus: 75000,
    letterType: "Hike + Performance Bonus",
    status: "Generated",
  },
  {
    id: "EMP004",
    performanceId: "PERF004",
    name: "Sneha Reddy",
    email: "sarmisthaacharya313@gmail.com",
    department: "HR",
    designation: "HR Executive",
    hike: "0%",
    performanceBonus: 0,
    letterType: "No Letter",
    status: "Not Eligible",
  },
];

function PerformanceLetters() {
  const [employees, setEmployees] = useState(initialEmployees);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [letterTypeFilter, setLetterTypeFilter] = useState("All");

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [sending, setSending] = useState(false);

  const letterRef = useRef(null);

  const functionUrl =
    process.env.REACT_APP_FUNCTION_URL || "/server/performance_letter_automation";

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const searchValue = search.toLowerCase().trim();

      const matchesSearch =
        !searchValue ||
        employee.name.toLowerCase().includes(searchValue) ||
        employee.id.toLowerCase().includes(searchValue) ||
        employee.email.toLowerCase().includes(searchValue) ||
        employee.department.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "All" || employee.status === statusFilter;

      const matchesLetterType =
        letterTypeFilter === "All" || employee.letterType === letterTypeFilter;

      return matchesSearch && matchesStatus && matchesLetterType;
    });
  }, [employees, search, statusFilter, letterTypeFilter]);

  const generatePdfBlob = async () => {
    if (!letterRef.current) {
      throw new Error("Letter preview is not available.");
    }

    const fileName = `Performance_Letter_${selectedEmployee.id}.pdf`;

    const options = {
      margin: [0.25, 0.25, 0.25, 0.25],
      filename: fileName,
      image: {
        type: "jpeg",
        quality: 0.98,
      },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: 0,
      },
      jsPDF: {
        unit: "in",
        format: "a4",
        orientation: "portrait",
      },
      pagebreak: {
        mode: ["css", "legacy"],
      },
    };

    const pdfBlob = await html2pdf()
      .set(options)
      .from(letterRef.current)
      .outputPdf("blob");

    return {
      blob: pdfBlob,
      fileName,
    };
  };

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        const result = reader.result;
        const base64 = result.split(",")[1];
        resolve(base64);
      };

      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handlePrint = async () => {
    if (!selectedEmployee) return;

    try {
      const { blob, fileName } = await generatePdfBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF generation error:", error);
      alert(error.message || "Unable to generate PDF.");
    }
  };

  const handleMarkReviewed = () => {
    if (!selectedEmployee) return;
    if (selectedEmployee.letterType === "No Letter") return;
    if (selectedEmployee.status === "Sent") return;

    const updatedEmployee = {
      ...selectedEmployee,
      status: "Reviewed",
    };

    setEmployees((current) =>
      current.map((emp) =>
        emp.id === selectedEmployee.id ? updatedEmployee : emp
      )
    );

    setSelectedEmployee(updatedEmployee);
  };

  const handleApproveAndSend = async () => {
    if (!selectedEmployee) return;

    if (selectedEmployee.letterType === "No Letter") {
      alert("This employee is not eligible for a letter.");
      return;
    }

    try {
      setSending(true);

      const { blob, fileName } = await generatePdfBlob();
      const pdfBase64 = await blobToBase64(blob);

      const endpoint = `\({functionUrl.replace(/\/\)/, "")}/send-letter`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: selectedEmployee.id,
          performanceId: selectedEmployee.performanceId,
          employeeName: selectedEmployee.name,
          employeeEmail: selectedEmployee.email,
          fileName,
          pdfBase64,
        }),
      });

      const responseText = await response.text();
      let result;

      try {
        result = JSON.parse(responseText);
      } catch (err) {
        throw new Error(
          `Catalyst returned a non-JSON response (HTTP \({response.status}):\){responseText.substring(0, 120)}`
        );
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to send performance letter");
      }

      const updatedEmployee = {
        ...selectedEmployee,
        status: "Sent",
      };

      setEmployees((current) =>
        current.map((emp) =>
          emp.id === selectedEmployee.id ? updatedEmployee : emp
        )
      );

      setSelectedEmployee(updatedEmployee);
      alert(`Performance letter sent successfully to ${selectedEmployee.email}`);
    } catch (error) {
      console.error("Approve & Send error:", error);
      alert(error.message || "Unable to send performance letter.");
    } finally {
      setSending(false);
    }
  };