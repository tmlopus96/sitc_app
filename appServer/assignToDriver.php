<?php

  require_once 'sitc_workforce_creds.php';

  $connection = new mysqli($hostname, $username, $password, $database);
  if ($connection->connect_error)
    die ($connection->connect_error);

  $personId = sanitize($_GET['personId']);
  $driverId = sanitize($_GET['driverId']);

  $query = "UPDATE CheckedIn SET assignedToDriver_id='$driverId' WHERE person_id='$personId'";
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
