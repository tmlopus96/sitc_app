<?php

  require_once 'sitc_workforce_creds.php';

  $connection = new mysqli($hostname, $username, $password, $database);
  if ($connection->connect_error)
    die ($connection->connect_error);

  if (isset($_GET['teerCarId'])) {
    $teerCarId = sanitize($_GET["teerCarId"]);
    echo "teerCarId: " . $teerCarId;
  }
  else {
    $query = "SELECT teerCar_id FROM VolunteerCar ORDER BY teerCar_id DESC LIMIT 1";
    $result = $connection->query($query);
    $teerCarId = $result->fetch_assoc()['teerCar_id'];
    $teerCarId++;
    echo "teerCarId: " . $teerCarId;
  }

  $queryFields = ["teerCar_id"];
  $queryValues = [$teerCarId];
  $updateClauses = [];


  if (isset($_GET["assignedNumPassengers"])) {
    $assignedNumPassengers = $_GET["assignedNumPassengers"];
    array_push($queryFields, 'assignedNumPassengers');
    array_push($queryValues, $assignedNumPassengers);
    array_push($updateClauses, "assignedNumPassengers=" . $assignedNumPassengers);
  }

  if (isset($_GET["assignedToSite"])) {
    $assignedToSite = $_GET["assignedToSite"];
    array_push($queryFields, 'assignedToSite');
    array_push($queryValues, "'" . $assignedToSite . "'");
    array_push($updateClauses, "assignedToSite='" . $assignedToSite . "'");
  }

  if (isset($_GET["driver_person_id"])) {
    // since isset evaluates '' as false, to make a driver null, the client sets the driver value to 'make_me_null', and we set it to '' here
    // $driver_person_id = (strcmp($_GET['driver_person_id'], 'make_me_null') == 0) ? 'NULL' : $_GET["driver_person_id"];
    $driver_person_id = $_GET["driver_person_id"];
    array_push($queryFields, 'driver_person_id');
    array_push($queryValues, $driver_person_id);
    array_push($updateClauses, "driver_person_id=" . $driver_person_id);
  }

  if (isset($_GET["isActive"])) {
    $isActive = $_GET["isActive"];
    array_push($queryFields, 'isActive');
    array_push($queryValues, $isActive);
    array_push($updateClauses, "isActive=" . $isActive);
  }


  $fieldsStr = join(', ', $queryFields);
  $valuesStr = '"' . join('", "', $queryValues) . '"';
  $updateStr = join(', ', $updateClauses);
  $query = "INSERT INTO VolunteerCar ($fieldsStr) VALUES ($valuesStr) ON DUPLICATE KEY UPDATE $updateStr";
  echo $query;
  $result = $connection->query($query);

  if (!$result) {
    die ($connection->error);
  }

  if ($result) {
    echo "succes";
  } else {
    http_response_code(500);
    exit('serverFail');
  }

?>

<?php
   function sanitize($var) {
     $clean_var = filter_var($var, FILTER_SANITIZE_STRING);
     return $clean_var;
   }
?>
