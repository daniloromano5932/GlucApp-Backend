import express from "express";
const router = express.Router();
import cors from "cors";

var corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

//Show User AVG Measurements over a period of time __works__
router.get("/average_measurements", cors(corsOptions), async (req, res, next) => {
  try {
    const averageMinbloodPressure = await req.db.query
      (`SELECT AVG(min_value) FROM blood_pressure WHERE user_id = '${req.headers.user_id}' AND date BETWEEN CURRENT_DATE - INTERVAL '${req.query.time_period} days' AND CURRENT_DATE`)
    const averageMaxbloodPressure = await req.db.query
      (`SELECT AVG(max_value) FROM blood_pressure WHERE user_id = '${req.headers.user_id}' AND date BETWEEN CURRENT_DATE - INTERVAL '${req.query.time_period} days' AND CURRENT_DATE`)
    const averageWeight = await req.db.query
      (`SELECT AVG(value) FROM weight WHERE user_id = '${req.headers.user_id}' AND date BETWEEN CURRENT_DATE - INTERVAL '${req.query.time_period} days' AND CURRENT_DATE`)
    const averageGlycemia = await req.db.query
      (`SELECT AVG(value) FROM glycemia WHERE user_id = '${req.headers.user_id}' AND date BETWEEN CURRENT_DATE - INTERVAL '${req.query.time_period} days' AND CURRENT_DATE`)
    const averageHeartRate = await req.db.query
      (`SELECT AVG(value) FROM heart_rate WHERE user_id = '${req.headers.user_id}' AND date BETWEEN CURRENT_DATE - INTERVAL '${req.query.time_period} days' AND CURRENT_DATE`)
    const average_measurements = {
      "averageMinBloodPressure": Math.round(averageMinbloodPressure.rows[0].avg),
      "averageMaxBloodPressure": Math.round(averageMaxbloodPressure.rows[0].avg),
      "averageWeight": Math.round(averageWeight.rows[0].avg),
      "averageGlycemia": Math.round(averageGlycemia.rows[0].avg),
      "averageHeartRate": Math.round(averageHeartRate.rows[0].avg),
    }
    res.send(average_measurements);
  } catch (err) {
    console.log(err)
  }
})

//Show Detailed User Measurements over last year
router.get("/unitary/:type", cors(corsOptions), async (req, res, next) => {
  try {
    if (req.query.time_period === 'YEAR') {
      if (req.params.type !== 'blood_pressure') {
        const getYearlyMeasurements = await req.db.query
          (`SELECT
          DATE_TRUNC('month', date) AS month,
          AVG(value) AS avg_metric
          FROM ${req.params.type}
          WHERE user_id = ${req.headers.user_id} AND
          EXTRACT(YEAR FROM date) = 2024
          GROUP BY
          DATE_TRUNC('month', date)
          ORDER BY
          month;`)
        res.send(getYearlyMeasurements.rows);
      } else {
        const getYearlyBPMeasurements = await req.db.query
          (`SELECT
        DATE_TRUNC('month', date) AS month,
        AVG(max_value) AS avg_max_metric,
		    AVG(min_value) AS avg_min_metric
        FROM blood_pressure
        WHERE user_id = ${req.headers.user_id} AND
        EXTRACT(YEAR FROM date) = 2024
        GROUP BY
        DATE_TRUNC('month', date)
        ORDER BY
        month;`)
        res.send(getYearlyBPMeasurements.rows);
      }
    } else if (req.query.time_period === 'MONTH') {
      if (req.params.type !== 'blood_pressure') {
        const getMonthlyMeasurements = await req.db.query
          (`SELECT 
      DATE(date) AS day_of_month,
      AVG(value) AS avg_metric
      FROM ${req.params.type}
      WHERE user_id = ${req.headers.user_id}
      AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
      AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
      GROUP BY DATE(date)
      ORDER BY DATE(date);`)
        res.send(getMonthlyMeasurements.rows)
      } else {
        const getMonthlyBPMeasurements = await req.db.query
          (`SELECT 
      DATE(date) AS day_of_month,
      AVG(max_value) AS avg_max_metric,
		  AVG(min_value) AS avg_min_metric
      FROM blood_pressure
      WHERE user_id = ${req.headers.user_id}
      AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
      AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
      GROUP BY DATE(date)
      ORDER BY DATE(date);`)
        res.send(getMonthlyBPMeasurements.rows)
      }
    } else if (req.query.time_period === 'WEEK') {
      if (req.params.type !== 'blood_pressure') {
        const getWeeklyMeasurements = await req.db.query
          (`SELECT 
      date::date AS day_of_week,
      AVG(value) AS avg_metric
      FROM ${req.params.type}
      WHERE
      user_id = ${req.headers.user_id}
      AND date >= (CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::int + 1)
      AND date < (CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::int + 8)
      GROUP BY day_of_week
      ORDER BY day_of_week;`
          )
        res.send(getWeeklyMeasurements.rows)
      } else {
        const getWeeklyBPMeasurements = await req.db.query(
          `SELECT 
      date::date AS day_of_week,
       AVG(max_value) AS avg_max_metric,
		  AVG(min_value) AS avg_min_metric
      FROM blood_pressure
      WHERE
      user_id = ${req.headers.user_id}
      AND date >= (CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::int + 1)
      AND date < (CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::int + 8)
      GROUP BY day_of_week
      ORDER BY day_of_week;`
        )
        res.send(getWeeklyBPMeasurements.rows)

      }
    }
    else {
      res.send([])
    }
  } catch (err) {
    console.log(err);
  }
})

//Insert User Measurements
router.post("/insert_measurements/:type", async (req, res) => {
  try {
    if (req.params.type !== 'blood_pressure') {
      const insertedUserMeasurements = await req.db.query(`INSERT INTO ${req.params.type} (date, value, user_id) VALUES ('${req.body.date}', ${req.body.value}, ${req.headers.user_id})`);
      res.send(insertedUserMeasurements);
    } else {
      const insertedUserBloodPressure = await req.db.query(`INSERT INTO ${req.params.type} (date, max_value, min_value, user_id) VALUES ('${req.body.date}', ${req.body.max_value}, ${req.body.min_value}, ${req.headers.user_id})`);
      res.send(insertedUserBloodPressure)
    }
  } catch (err) {
    console.log(err);
  }
})

//Modify User Measurements
router.put("/modify_measurements/:type", async (req, res) => {
  try {
    if (req.params.type !== 'blood_pressure') {
      const modifiedUserMeasurements = await req.db.query(
        `UPDATE ${req.params.type}
      SET date = '${req.body.date}',
          value = ${req.body.value}
      WHERE user_id = ${req.headers.user_id} AND id = ${req.body.id};`);
      res.send(modifiedUserMeasurements);
    } else {
      const modifiedUserBloodPressure = await req.db.query(
        `
      UPDATE ${req.params.type}
      SET date = '${req.body.date}',
          max_value = ${req.body.max_value},
          min_value = ${req.body.min_value}
      WHERE user_id = ${req.headers.user_id} AND id = ${req.body.id};
      `);
      res.send(modifiedUserBloodPressure)
    }
  } catch (err) {
    console.log(err);
  }
})

//Delete User Measurements
router.delete("/delete_measurements/:type", async (req, res) => {
  try {
    const deletedMeasurement = await req.db.query(`DELETE FROM ${req.params.type} WHERE user_id = ${req.headers.user_id} AND id = ${req.body.id}`);
    res.send(deletedMeasurement)
  } catch (err) {
    console.log(err);
  }
})

export default router;
