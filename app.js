const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDbObjToResponseStateObj = (dbObj) => {
  return {
    stateId: dbObj.state_id,
    stateName: dbObj.state_name,
    population: dbObj.population,
  };
};

//Get States API

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT
        *
    FROM 
        state;`;
  const statesArray = await db.all(getStatesQuery);
  response.send(
    statesArray.map((eachState) => convertDbObjToResponseStateObj(eachState))
  );
});

//Get state API

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT 
        *
    FROM
        state
    WHERE
        state_id = ${stateId};`;
  const stateArray = await db.get(getStateQuery);
  response.send(convertDbObjToResponseStateObj(stateArray));
});

//Update State API

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `
    INSERT INTO 
        district(district_name, state_id, cases, cured, active, deaths)
    VALUES (
        '${districtName}',
         ${stateId},
         ${cases},
         ${cured},
         ${active},
         ${deaths}
         );`;
  const updateDistrict = await db.run(updateDistrictQuery);
  response.send("District Successfully Added");
});

const converDbObjToDistrictResponseObj = (dbObj) => {
  return {
    districtId: dbObj.district_id,
    districtName: dbObj.district_name,
    stateId: dbObj.state_id,
    cases: dbObj.cases,
    cured: dbObj.cured,
    active: dbObj.active,
    deaths: dbObj.deaths,
  };
};

//Get District API

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT 
        *  
    FROM   
        district
    WHERE
        district_id = ${districtId};`;
  const getDistrict = await db.get(getDistrictQuery);
  response.send(converDbObjToDistrictResponseObj(getDistrict));
});

// Delete State API

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM    
        district
    WHERE 
        district_id = ${districtId};`;
  const dbResponse = await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//Upadate District API

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `
    UPDATE 
        district
    SET 
        district_name = '${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}   
    WHERE 
        district_id = ${districtId}; 
    ;`;
  const dbResponse = await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

// Get Total Cases API

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getTotalCases = `
    SELECT 
        SUM(cases) AS totalCases, 
        SUM(cured) AS totalCured,
        SUM(active) AS totalActive,
        SUM(deaths) AS totalDeaths
    FROM
        district
    WHERE
        state_id = ${stateId};`;
  const dbResponse = await db.get(getTotalCases);
  response.send(dbResponse);
});

//Get State API

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateQuery = `
    SELECT 
        state_name AS stateName
    FROM 
        state JOIN district ON state.state_id = district.state_id
    WHERE 
        district_id = ${districtId};`;
  const dbResponse = await db.get(getStateQuery);
  response.send(dbResponse);
});

module.exports = app;
