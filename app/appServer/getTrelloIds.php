<?php

  require_once 'sitc_workforce_creds.php';

  $connection = new mysqli($hostname, $username, $password, $database);
  if ($connection->connect_error)
    die ($connection->connect_error);

  $carpoolSite = (isset($_GET['carpoolSite'])) ? sanitize($_GET['carpoolSite']) : '';

  $query = "SELECT * FROM TrelloId WHERE element='notes_board' OR element='api_key'";

  if ($carpoolSite) {
    $query .= " OR element='$carpoolSite'";
  }

  $trelloIds_result = $connection->query($query);
  if ($connection->error) {
    die ($connection->error);
  }

  $trelloIds = array();
  while ($currentId = $trelloIds_result->fetch_assoc()) {
    $trelloIds[] = $currentId;
  }

  echo json_encode($trelloIds);

 ?>

 <?php
   function sanitize($var) {
     $clean_var = filter_var($var, FILTER_SANITIZE_STRING);
     return $clean_var;
   }
 ?>
