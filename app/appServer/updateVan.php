<?php

  require_once 'sitc_workforce_creds.php';

  $connection = new mysqli($hostname, $username, $password, $database);
  if ($connection->connect_error)
    die ($connection->connect_error);

  $vanId = (isset($_GET['vanId'])) ? sanitize($_GET['vanId']) : '';

  $queryFields = ["van_id"];
  $queryValues = [$vanId];
  $updateClauses = [];


  if (isset($_GET["numPassengers"])) {
    $numPassengers = $_GET["numPassengers"];
    array_push($queryFields, 'numPassengers');
    array_push($queryValues, $numPassengers);
    array_push($updateClauses, "numPassengers=" . $numPassengers);
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
  $query = "INSERT INTO Van ($fieldsStr) VALUES ($valuesStr) ON DUPLICATE KEY UPDATE $updateStr";
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
