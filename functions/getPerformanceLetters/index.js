const express = require("express");
const catalyst = require("zcatalyst-sdk-node");

const app = express();

app.use(express.json());

/* ---------------------------------------------------------
   CORS
--------------------------------------------------------- */
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS"
    );
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type"
    );

    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }

    next();
});


/* ---------------------------------------------------------
   GET PERFORMANCE LETTER DATA
--------------------------------------------------------- */

app.get("/performance-letters", async (req, res) => {

    try {

        const catalystApp = catalyst.initialize(req);

        const datastore = catalystApp.datastore();

        /* -------------------------------------------------
           GET TABLES
        ------------------------------------------------- */

        const employeeTable =
            datastore.table("Employee");

        const designationTable =
            datastore.table("Designation");

        const departmentTable =
            datastore.table("Department");

        const performanceTable =
            datastore.table("Performance");


        /* -------------------------------------------------
           FETCH RECORDS
        ------------------------------------------------- */

        const employees =
            await employeeTable.getAllRows();

        const designations =
            await designationTable.getAllRows();

        const departments =
            await departmentTable.getAllRows();

        const performances =
            await performanceTable.getAllRows();


        /* -------------------------------------------------
           CREATE LOOKUP MAPS
        ------------------------------------------------- */

        const designationMap = {};

        designations.forEach((d) => {

            designationMap[String(d.Designation_ID)] =
                d.Designation_Name;

        });


        const departmentMap = {};

        departments.forEach((d) => {

            departmentMap[String(d.Department_ID)] =
                d.Department_Name;

        });


        /*
           Employee lookup.

           Used for Manager_ID → Employee_Name
        */

        const employeeMap = {};

        employees.forEach((employee) => {

            employeeMap[String(employee.Employee_ID)] =
                employee;

        });


        /* -------------------------------------------------
           PERFORMANCE → EMPLOYEE
        ------------------------------------------------- */

        const result = performances.map((performance) => {

            /*
              Performance.Employee_ID is a foreign key.

              Depending on Catalyst's returned structure,
              the value may be represented differently.
            */

            const employeeId =
                performance.Employee_ID;

            const employee =
                employeeMap[String(employeeId)] || {};


            const designation =
                designationMap[
                    String(employee.Designation_ID)
                ] || "";


            const department =
                departmentMap[
                    String(employee.Department_ID)
                ] || "";


            const manager =
                employeeMap[
                    String(employee.Manager_ID)
                ] || {};


            /* ---------------------------------------------
               FRONTEND RECORD
            --------------------------------------------- */

            return {

                /* Employee */
                emp_id:
                    employee.Employee_ID || "",

                employee_name:
                    employee.Employee_Name || "",

                employee_email:
                    employee.Email || "",

                /* Organization */
                designation:
                    designation,

                department:
                    department,

                super_manager:
                    manager.Employee_Name || "",

                /* Performance */
                appraisal_year:
                    performance.Appraisal_Year || "",

                hike_percentage:
                    performance.Hike_Percentage || 0,

                performance_bonus:
                    performance.Performance_Bonus || 0,

                effective_date:
                    performance.Effective_Date || "",

                /* Letter */
                letter_type:
                    performance.Letter_Type || "",

                status:
                    performance.Letter_Status || "Draft",

                generated_date:
                    performance.Generated_Date || "",

                sent_date:
                    performance.Sent_Date || "",

                letter_generation:
                    performance.Letter_Generation || "",

                /* Internal ID */
                _performance_rowid:
                    performance.ROWID || "",

                performance_id:
                    performance.Performance_ID || "",


                /* -----------------------------------------
                   CURRENT FRONTEND COMPATIBILITY FIELDS

                   These will be populated once we connect
                   the salary/compensation table.
                ----------------------------------------- */

                new_base_salary: 0,

                hike_amount: 0,

                new_pb_offered:
                    performance.Performance_Bonus || 0,

                instalment_q1: 0,
                instalment_q2: 0,
                instalment_q3: 0,
                instalment_q4: 0,

                new_rb: 0,

                total_bonus:
                    performance.Performance_Bonus || 0,

                total_ctc_rewards: 0,

                promotion: false,

                new_title:
                    designation,


                /* -----------------------------------------
                   REVIEW / SEND FIELDS
                ----------------------------------------- */

                reviewed_at: "",

                reviewed_by: "",

                dispatch_timestamp:
                    performance.Sent_Date || "",

                sent_by: ""
            };
        });


        /* -------------------------------------------------
           RESPONSE
        ------------------------------------------------- */

        return res.status(200).json({
            success: true,
            count: result.length,
            data: result
        });

    } catch (error) {

        console.error(
            "Performance letter API error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Failed to load performance data",

            data: []
        });
    }
});


/* ---------------------------------------------------------
   DEFAULT ROUTE
--------------------------------------------------------- */

app.get("/", (req, res) => {

    res.status(200).json({
        success: true,
        message: "Performance Letter API is running"
    });

});


/* ---------------------------------------------------------
   START SERVER
--------------------------------------------------------- */

app.listen(() => {
    console.log(
        "Performance Letter Catalyst function started"
    );
});