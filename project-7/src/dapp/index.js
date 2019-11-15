import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async () => {

  let result = null;

  let available_flights = [];

  function resolveFlight(flightnum) {
    for (let i = 0; i < available_flights.length; i++) {
      if (available_flights[i].flightNumber === flightnum) {
        return available_flights[i];
      }
    }
    return null;
  }

  let contract = new Contract('localhost', () => {
    let self = this;

    // Initialize three flights
    available_flights = [
      {
        time: "09:00",
        timestamp: Math.floor(Date.now() / 1000),
        target: "Larnaca",
        flightNumber: "CY100",
        airline: contract.owner,
        status: "0"
      },
      {
        time: "10:00",
        timestamp: Math.floor(Date.now() / 1000),
        target: "Athens",
        flightNumber: "AE1502",
        airline: contract.owner,
        status: "0"
      },
      {
        time: "11:00",
        timestamp: Math.floor(Date.now() / 1000),
        target: "Tel-Aviv",
        flightNumber: "EL1000",
        airline: contract.owner,
        status: "0"
      }
    ];


    // Read transaction
    contract.isOperational((error, result) => {
      console.log(error ? error : "", "Contract operational status: " + result);

      displayOperationalStatus([{label: 'Operational Status', error: error, value: result}]);
      displayFlightplan(available_flights, fetchFlightStatusCallback, registerFlightCallback);
      contract.insuranceBalance(insuranceBalanceCallback);
    });

    // User-submitted transaction
    DOM.elid('passengerWithdraw').addEventListener('click', () => {
      contract.passengerWithdraw(function () {
        contract.insuranceBalance(insuranceBalanceCallback);
      });
    });

    contract.oracleReport(result => {
      console.log(JSON.stringify(result));
    });

    contract.flightStatusInfo(result => {
      console.log(JSON.stringify(result));
      let updateFlight = resolveFlight(result.flight);
      if (updateFlight !== null) {
        updateFlight.status = result.status;
        let flight_row = DOM.elid("row_" + result.flight);
        displayUpdateFlightplanRow(flight_row, updateFlight, fetchFlightStatusCallback, registerFlightCallback);
      } else {
        console.log("Unable to find Flight");
      }

      contract.insuranceBalance(insuranceBalanceCallback);
    });
  });

  function registerFlightCallback(flight, value) {
    contract.registerFlight(resolveFlight(flight), value, () => {
      console.log("Flight registered for insurance: " + JSON.stringify(flight));
    })
  }

  function fetchFlightStatusCallback(flight) {
    contract.fetchFlightStatus(resolveFlight(flight), (error, result) => {
      if (error) {
        console.log(error);
      } else {
        console.log(result)
      }
    });
  }

  function insuranceBalanceCallback(result) {
    displayBalance(result);
  }

})();

function displayBalance(value) {
  let divBalance = DOM.elid("passengerBalance");
  divBalance.innerHTML = value + ' ETH';
}

function displayFlightplan(flights, fetchFlightStatusCallback, registerFlightCallback) {
  let displayDiv = DOM.elid("display-wrapper");
  displayDiv.innerHTML = "";

  // Available Flights
  let sectionFlightPlan = DOM.section();
  sectionFlightPlan.appendChild(DOM.h2("Flightplan"));

  if (flights !== null) {
    sectionFlightPlan.appendChild(DOM.h5("Currently available flights"));

    flights.map((flight) => {
      let row_id = 'row_' + flight.flightNumber;

      let row = sectionFlightPlan.appendChild(DOM.div({id: row_id, className: 'row'}));
      displayUpdateFlightplanRow(row, flight, fetchFlightStatusCallback, registerFlightCallback);

      sectionFlightPlan.appendChild(row);
    })

  } else {
    sectionFlightPlan.appendChild(DOM.h5("Loading available Flights..."));
  }

  displayDiv.append(sectionFlightPlan);


}

function displayUpdateFlightplanRow(row, flight, fetchFlightStatusCallback, registerFlightCallback) {

  function resolveStatusText(status_id) {
    switch (status_id) {
      case "0":
        return "Unknown Status";

      case "10":
        return "On Time";

      case "20":
        return "Late Airline";

      case "30":
        return "Later Weather";

      case "40":
        return "Late Technical";

      case "50":
        return "Late Other";
    }

    return "not Available";
  }

  row.innerHTML = "";

  let dataElementId = flight.flightNumber + '_value';

  row.appendChild(DOM.div({className: 'col-sm-1 field-value', style: {margin: 'auto 0 auto 0'}}, flight.time));
  row.appendChild(DOM.div({className: 'col-sm-1 field-value', style: {margin: 'auto 0 auto 0'}}, flight.flightNumber));
  row.appendChild(DOM.div({className: 'col-sm-2 field-value', style: {margin: 'auto 0 auto 0'}}, flight.target));
  row.appendChild(DOM.div({
    className: 'col-sm-2 field',
    style: {margin: 'auto 0 auto 0', color: flight.status === "20" ? '#FFFF00' : '#FFFFFF'}
  }, resolveStatusText(flight.status)));

  let edtValue = DOM.input({
    id: dataElementId,
    className: 'field-value',
    style: {margin: 'auto 5px auto 30px', width: '40px', 'text-align': 'left'},
    value: '0.5'
  });
  row.appendChild(edtValue);

  row.appendChild(DOM.div({className: 'field-value', style: {margin: 'auto 0 auto 0', width: '60px'}}, "ETH"));

  let buttonInsuring = DOM.button({className: 'btn btn-success', style: {margin: '5px'}}, "Insure Flight");
  buttonInsuring.addEventListener('click', () => {
    registerFlightCallback(flight.flightNumber, DOM.elid(dataElementId).value);
  });
  row.appendChild(buttonInsuring);

  let buttonFetchStatus = DOM.button({
    className: 'btn btn-primary',
    style: {margin: 'auto 0 auto 40px'}
  }, "Get Flight Status");
  buttonFetchStatus.addEventListener('click', () => {
    fetchFlightStatusCallback(flight.flightNumber);
  });
  row.appendChild(buttonFetchStatus);

}

function displayOperationalStatus(status) {
  let displayDiv = DOM.elid("display-wrapper-operational");
  displayDiv.innerHTML = "";

  let sectionOperationalStatus = DOM.section();
  sectionOperationalStatus.appendChild(DOM.h4('Operational Status'));
  sectionOperationalStatus.appendChild(DOM.h5('Check if contract is operational'));
  status.map((result) => {
    let row = sectionOperationalStatus.appendChild(DOM.div({className: 'row'}));
    // row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
    row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
    sectionOperationalStatus.appendChild(row);
  })
  displayDiv.append(sectionOperationalStatus);
};




