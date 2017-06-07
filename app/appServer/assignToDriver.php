<?php

  require_once 'sitc_workforce_creds.php';

  $connection = new mysqli($hostname, $username, $password, $database);
  if ($connection->connect_error)
    die ($connection->connect_error);

  $personId = sanitize($_GET['personId']);
  $driverId = sanitize($_GET['driverId']);
  $assignedToSite_id = (isset($_GET['assignedToSite_id'])) ? sanitize($_GET['assignedToSite_id']) : null;
  $assignedToProject = (isset($_GET['assignedToProject'])) ? sanitize($_GET['assignedToProject']) : null;

  $query = "UPDATE CheckedIn SET assignedToDriver_id='$driverId'";

  if ($assignedToSite_id) {
    $query .= ", assignedToSite_id='$assignedToSite_id'";
  }

  if ($assignedToProject) {
    $query .= ", assignedToProject='$assignedToProject'";
  }

  $query .= "WHERE person_id=$personId";

  echo $query;

  $result_logisticsSched = $connection->query($query);
  if ($connection->error)
    die ($connection->error);

 ?>

 <?php
 	function sanitize($var) {
 		$clean_var = filter_var($var, FILTER_SANITIZE_STRING);
 		return $clean_var;
 	}
 ?>
