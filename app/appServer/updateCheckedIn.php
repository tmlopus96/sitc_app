<?php

  require_once 'sitc_workforce_creds.php';

  $connection = new mysqli($hostname, $username, $password, $database);
  if ($connection->connect_error)
    die ($connection->connect_error);

  $id = isset($_GET["id"]) ? intval(sanitize($_GET["id"])) : "";
  $isCheckedIn = isset($_GET["isCheckedIn"]) ? intval(sanitize($_GET["isCheckedIn"])) : "";
  $carpoolSite = isset($_GET["carpoolSite"]) ? sanitize($_GET["carpoolSite"]) : "";
  $project = isset($_GET["project"]) ? sanitize($_GET["project"]) : "";
  $projectRaw = isset($_GET["project"]) ? $_GET["project"] : "";
  $site = isset($_GET["site"]) ? sanitize($_GET["site"]) : "";
  $driverStatus = isset($_GET["driverStatus"]) ? sanitize($_GET["driverStatus"]) : "";
  $assignedToDriver = isset($_GET["assignedToDriver"]) ? sanitize($_GET["assignedToDriver"]) : "";
  $numSeatbelts = isset($_GET["numSeatbelts"]) ? sanitize($_GET["numSeatbelts"]) : "";
  $numSeatbeltsToday = isset($_GET["numSeatbeltsToday"]) ? sanitize($_GET["numSeatbeltsToday"]) : "";
  echo $site;

  $queryFields = ["person_id"];
  $queryValues = [$id];
  $updateClauses = [];

  if ($isCheckedIn != '' && $isCheckedIn != null) {
    array_push($queryFields, 'isCheckedIn');
    array_push($queryValues, $isCheckedIn);
    array_push($updateClauses, "isCheckedIn=" . $isCheckedIn);
  }

  if ($carpoolSite != '' && $carpoolSite != null) {
    array_push($queryFields, 'carpoolSite_id');
    array_push($queryValues, "'" . $carpoolSite . "'");
    array_push($updateClauses, "carpoolSite_id='" . $carpoolSite . "'");
  }

  if ($project != "" && $project != null) {
    if ($project == "NULL") {
      echo 'project is NULL';
      $project = '';
    } //value they are given by removeAssignment in AssignedSitePickerSheetController
    array_push($queryFields, 'assignedToProject');
    array_push($queryValues, "'" . $project . "'");
    array_push($updateClauses, "assignedToProject='" . $project . "'");
  }
  if ($site != "" && $site != null) {
    if ($site == "NULL") {
      $site = '';
    } //value they are given by removeAssignment in AssignedSitePickerSheetController
    array_push($queryFields, "assignedToSite_id");
    array_push($queryValues, "'" . $site . "'");
    array_push($updateClauses, "assignedToSite_id='" . $site . "'");
  }
  if ($driverStatus != "" && $driverStatus != null) {
    array_push($queryFields, "driverStatus");
    array_push($queryValues, "'" . $driverStatus . "'");
    array_push($updateClauses, "driverStatus='" . $driverStatus . "'");
  }
  if ($assignedToDriver != "" && $assignedToDriver != null) {
    array_push($queryFields, "assignedToDriver_id");
    array_push($queryValues, $assignedToDriver);
    array_push($updateClauses, "assignedToDriver_id='" . $assignedToDriver . "'");
  }
  if ($numSeatbelts != "" && $numSeatbelts != null) {
    array_push($queryFields, "numSeatbelts");
    array_push($queryValues, $numSeatbelts);
    array_push($updateClauses, "numSeatbelts=" . $numSeatbelts);
  }
  if ($numSeatbeltsToday != "" && $numSeatbeltsToday != null) {
    array_push($queryFields, "numSeatbeltsToday");
    array_push($queryValues, $numSeatbeltsToday);
    array_push($updateClauses, "numSeatbeltsToday=" . $numSeatbeltsToday);
  }

  $fieldsStr = join(', ', $queryFields);
  $valuesStr = join(', ', $queryValues);
  $updateStr = join(', ', $updateClauses);
  $query = "INSERT INTO CheckedIn ($fieldsStr) VALUES ($valuesStr) ON DUPLICATE KEY UPDATE $updateStr";
  echo $query;

  $connection->query($query);

  if ($connection->error)
    die ($connection->error);

?>

<?php
 function sanitize($var) {
   $clean_var = filter_var($var, FILTER_SANITIZE_STRING);
   return $clean_var;
 }
?>
