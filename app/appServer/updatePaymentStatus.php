<?php

  require_once 'sitc_workforce_creds.php';

  $connection = new mysqli($hostname, $username, $password, $database);
  if ($connection->connect_error)
    die ($connection->connect_error);

  $id = isset($_GET["personId"]) ? intval(sanitize($_GET["personId"])) : "";
  $amountPaid = isset($_GET["amountPaid"]) ? intval(sanitize($_GET["amountPaid"])) : "";
  $checkNumber = isset($_GET["checkNumber"]) ? intval(sanitize($_GET["checkNumber"])) : "";

  $queryString = "UPDATE RegistrationInfo r SET paymentStatus=1, paymentAmount=$amountPaid";

  if (isset($_GET["checkNumber"])) {
    $queryString = $queryString . ", checkNumber=$checkNumber";
  }

  $queryString = $queryString . " WHERE r.person_id=$id";

  echo $queryString;

  $query = $queryString;
  $result = $connection->query($query);
  if ($connection->error) {
    die ($connection->error);
  }

  echo json_encode($result);

 ?>

 <?php
   function sanitize($var) {
     $clean_var = filter_var($var, FILTER_SANITIZE_STRING);
     return $clean_var;
   }
 ?>
