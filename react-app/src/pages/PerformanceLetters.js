import React, { useState } from "react";

const employees = [
  {
    id: "E001",
    name: "Rahul Sharma",
    designation: "Software Engineer",
    hike: 10,
    bonus: 0,
    type: "Hike Letter",
    status: "Pending",
  },
  {
    id: "E002",
    name: "Priya Das",
    designation: "Senior Developer",
    hike: 0,
    bonus: 25000,
    type: "Performance Bonus Letter",
    status: "Pending",
  },
  {
    id: "E003",
    name: "Amit Kumar",
    designation: "Team Lead",
    hike: 8,
    bonus: 20000,
    type: "Hike + Performance Bonus",
    status: "Generated",
  },
  {
    id: "E004",
    name: "Sneha Patra",
    designation: "HR Executive",
    hike: 0,
    bonus: 0,
    type: "No Letter",
    status: "Not Eligible",
  },
];

function PerformanceLetters() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [typeFilter, setTypeFilter] = useState("All Letter Types");
  const [loadingId, setLoadingId] = useState(null);

  const filteredEmployees = employees.filter((employee) => {
    const searchValue = search.toLowerCase();

    const matchesSearch =
      employee.id.toLowerCase().includes(searchValue) ||
      employee.name.toLowerCase().includes(searchValue) ||
      employee.designation.toLowerCase().includes(searchValue);

    const matchesStatus =
      statusFilter === "All Status" ||
      employee.status === statusFilter;

    const matchesType =
      typeFilter === "All Letter Types" ||
      employee.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const generateLetter = async (employee) => {
    try {
      setLoadingId(employee.id);

      const response = await fetch(
        "https://performanceletterautomation-60087256467.development.catalystserverless.in/server/generate_performance_letter/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            hikePercentage: employee.hike,
            performanceBonus: employee.bonus,
          }),
        }
      );

      const responseText = await response.text();

      console.log("Response status:", response.status);
      console.log("Response:", responseText);

      let data;

      try {
        data = JSON.parse(responseText);
      } catch (error) {
        throw new Error(
          `Server returned an invalid response. Status: ${response.status}`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to determine letter type"
        );
      }

      alert(`Letter Type: ${data.letterType}`);

    } catch (error) {
      console.error("Generate Letter Error:", error);
      alert(error.message);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="performance-page">

      <div className="page-heading">

        <div>
          <h1>Performance Letters</h1>

          <p>
            Review employee performance outcomes and generate applicable
            letters.
          </p>
        </div>

      </div>

      <div className="filter-bar">

        <div className="search-box">

          <input
            type="text"
            placeholder="Search employee..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option>All Status</option>
          <option>Pending</option>
          <option>Generated</option>
          <option>Sent</option>
          <option>Not Eligible</option>
        </select>

        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
        >
          <option>All Letter Types</option>
          <option>Hike Letter</option>
          <option>Performance Bonus Letter</option>
          <option>Hike + Performance Bonus</option>
          <option>No Letter</option>
        </select>

      </div>

      <div className="performance-card">

        <div className="table-header">

          <div>

            <h3>
              Employee Performance
            </h3>

            <span>
              Showing {filteredEmployees.length} of{" "}
              {employees.length} employees
            </span>

          </div>

        </div>

        <div className="table-wrapper">

          <table className="performance-table">

            <thead>

              <tr>

                <th>
                  Employee ID
                </th>

                <th>
                  Employee Name
                </th>

                <th>
                  Designation
                </th>

                <th>
                  Hike %
                </th>

                <th>
                  Performance Bonus
                </th>

                <th>
                  Letter Type
                </th>

                <th>
                  Status
                </th>

                <th>
                  Action
                </th>

              </tr>

            </thead>

            <tbody>

              {filteredEmployees.length === 0 ? (

                <tr>

                  <td
                    colSpan="8"
                    className="empty-table"
                  >
                    No employees found.
                  </td>

                </tr>

              ) : (

                filteredEmployees.map((employee) => (

                  <tr key={employee.id}>

                    <td className="employee-id">
                      {employee.id}
                    </td>

                    <td>
                      <strong>
                        {employee.name}
                      </strong>
                    </td>

                    <td>
                      {employee.designation}
                    </td>

                    <td>
                      {employee.hike}%
                    </td>

                    <td>
                      ₹{employee.bonus.toLocaleString("en-IN")}
                    </td>

                    <td>

                      <span className="letter-type">
                        {employee.type}
                      </span>

                    </td>

                    <td>

                      <span
                        className={`table-status ${employee.status
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      >
                        {employee.status}
                      </span>

                    </td>

                    <td>

                      {employee.status === "Pending" && (

                        <button
                          className="generate-button"
                          onClick={() => generateLetter(employee)}
                          disabled={loadingId === employee.id}
                        >
                          {loadingId === employee.id
                            ? "Generating..."
                            : "Generate"}
                        </button>

                      )}

                      {employee.status === "Generated" && (

                        <button className="view-button">
                          View
                        </button>

                      )}

                      {employee.status === "Sent" && (

                        <button className="view-button">
                          View
                        </button>

                      )}

                      {employee.status === "Not Eligible" && (

                        <span className="disabled-action">
                          —
                        </span>

                      )}

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

export default PerformanceLetters;