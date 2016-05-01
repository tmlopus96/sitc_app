<?php

  require_once 'sitc_workforce_creds.php';

  echo "HELLO WORDD";

  $connection = new mysqli($hostname, $username, $password, $database);
  if ($connection->connect_error)
    die ($connection->connect_error);

  $id = isset($_GET["id"]) ? sanitize($_GET["id"]) : "";
  $carpoolSite = isset($_GET["carpoolSite"]) ? sanitize($_GET["carpoolSite"]) : "";
  $project = isset($_GET["project"]) ? sanitize($_GET["project"]) : "";
  $site = isset($_GET["site"]) ? sanitize($_GET["site"]) : "";
  $driverStatus = isset($_GET["driverStatus"]) ? sanitize($_GET["driverStatus"]) : "";
  $assignedToDriver = isset($_GET["assignedToDriver"]) ? sanitize($_GET["assignedToDriver"]) : "";
  echo $site;

  $queryFields = ["person_id", "carpoolSite_id"];
  $queryValues = [$id, $carpoolSite];
  $updateClauses = [];
  if ($project != "" && $project != null) {
    array_push($queryFields, 'assignedToProject');
    array_push($queryValues, $project);
    array_push($updateClauses, "assignedToProject='" . $project . "'");
  }
  if ($site != "" && $site != null) {
    array_push($queryFields, "assignedToSite_id");
    array_push($queryValues, $site);
    array_push($updateClauses, "assignedToSite_id='" . $site . "'");
  }
  if ($driverStatus != "" && $driverStatus != null) {
    array_push($queryFields, "driverStatus");
    array_push($queryValues, $driverStatus);
    array_push($updateClauses, "driverStatus='" . $driverStatus . "'");
  }
  if ($assignedToDriver != "" && $assignedToDriver != null) {
    array_push($queryFields, "assignedToDriver_id");
    array_push($queryValues, $assignedToDriver);
    array_push($updateClauses, "assignedToDriver_id='" . $assignedToDriver . "'");
  }

  $fieldsStr = join(', ', $queryFields);
  $valuesStr = '"' . join('", "', $queryValues) . '"';
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
