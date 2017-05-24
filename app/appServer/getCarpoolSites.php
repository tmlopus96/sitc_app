<?php

  require_once 'sitc_workforce_creds.php';

  $connection = new mysqli($hostname, $username, $password, $database);
  if ($connection->connect_error)
    die ($connection->connect_error);

  // WHERE id!='' exclude the null carpool site, which is kept in the db to satisfy the foreign key check on someone with no carpool site
  $query = "SELECT * FROM CarpoolSite WHERE carpoolSite_id!=''";
  $carpoolSites_result = $connection->query($query);
  if ($connection->error) {
    die ($connection->error);
  }

  $sites = array();
  while ($currentSite = $carpoolSites_result->fetch_assoc()) {
    $sites[] = $currentSite;
  }

  echo json_encode($sites);

 ?>

 <?php
   function sanitize($var) {
     $clean_var = filter_var($var, FILTER_SANITIZE_STRING);
     return $clean_var;
   }
 ?>
