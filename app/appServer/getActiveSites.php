<?php

  require_once 'sitc_workforce_creds.php';

  $connection = new mysqli($hostname, $username, $password, $database);
  if ($connection->connect_error)
    die ($connection->connect_error);

  $carpoolSite = sanitize($_GET['carpoolSite']);

  //get active project sites for this carpool site
  //$query = "SELECT * FROM LogisticsSchedule WHERE carpoolSite_id='$carpoolSite'";
  $query = "SELECT DISTINCT ch.assignedToSite_id, v.assignedToSite, tc.assignedToSite FROM CheckedIn ch, Van v, VolunteerCar tc WHERE (ch.carpoolSite_id='$carpoolSite' && ch.assignedToSite_id!='') OR (v.carpoolSite='$carpoolSite' && v.assignedToSite!='') OR (tc.carpoolSite_id='$carpoolSite' && tc.assignedToSite!='')";
  // echo "Query 1: " . $query . "&nbsp";
  $result_sites = $connection->query($query);
  if ($connection->error)
    die ($connection->error);

  $activeSites = array();
  while ($site = $result_sites->fetch_assoc()) {
    $activeSites[] = "'" . $site['assignedToSite_id'] . "'";
  }

  // echo json_encode($activeSites);

  $sitesForQuery = join(',', $activeSites);
  $query = "SELECT projectSite_id, name, project FROM ProjectSite WHERE projectSite_id IN ($sitesForQuery)";
  // echo "Query 2: " . $query;
  $result_siteInfo = $connection->query($query);
  if ($connection->error)
    die ($connection->error);

  $siteInfo = array();
  while ($currentSite = $result_siteInfo->fetch_assoc()) {
    $siteInfo[] = $currentSite;
  }

  echo json_encode($siteInfo);
 ?>

 <?php
 	function sanitize($var) {
 		$clean_var = filter_var($var, FILTER_SANITIZE_STRING);
 		return $clean_var;
 	}
 ?>
