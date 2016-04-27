<?php

  require_once 'sitc_workforce_creds.php';

  $connection = new mysqli($hostname, $username, $password, $database);
  if ($connection->connect_error)
    die ($connection->connect_error);

  $carpoolSite = sanitize($_GET['carpoolSite']);

  //get active project sites for this carpool site
  $query = "SELECT * FROM LogisticsSchedule WHERE carpoolSite_id='$carpoolSite'";
  $result_logisticsSched = $connection->query($query);
  if ($connection->error)
    die ($connection->error);

  $activeSites = array();
  $resultArray = $result_logisticsSched->fetch_array(MYSQLI_NUM);
  foreach ($resultArray as $site) {
    if ($site != '') {
      $siteString = "'" . $site . "'";
      $activeSites[] = $siteString;
    }
  }

  //splice off carpoolSite_id (first element)
  array_splice($activeSites, 0, 1);

  $sitesForQuery = join(',', $activeSites);
  $query = "SELECT projectSite_id, name, project FROM ProjectSite WHERE projectSite_id IN ($sitesForQuery)";
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
