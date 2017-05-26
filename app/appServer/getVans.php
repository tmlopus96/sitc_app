<?php

  require_once 'sitc_workforce_creds.php';

  $connection = new mysqli($hostname, $username, $password, $database);
  if ($connection->connect_error)
    die ($connection->connect_error);

  $carpoolSite = (isset($_GET['carpoolSite'])) ? sanitize($_GET['carpoolSite']) : '';

  $query = "SELECT * FROM Van";

  if ($carpoolSite) {
    $query .= " WHERE carpoolSite='$carpoolSite'";
  }

  $vans_result = $connection->query($query);
  if ($connection->error) {
    die ($connection->error);
  }

  $vans = array();
  while ($currentVan = $vans_result->fetch_assoc()) {
    $vans[] = $currentVan;
  }

  echo json_encode($vans);

 ?>

 <?php
   function sanitize($var) {
     $clean_var = filter_var($var, FILTER_SANITIZE_STRING);
     return $clean_var;
   }
 ?>
