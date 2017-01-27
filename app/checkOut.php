<?php

  require_once 'sitc_workforce_creds.php';

  $connection = new mysqli($hostname, $username, $password, $database);
  if ($connection->connect_error)
    die ($connection->connect_error);

  $id = sanitize($_GET['id']);

  $query = "DELETE FROM CheckedIn WHERE person_id=$id";
  $result = $connection->query($query);
  if (!$result)
    die ($connection->error);

?>

 <?php
  function sanitize($var) {
    $clean_var = filter_var($var, FILTER_SANITIZE_STRING);
    return $clean_var;
  }
 ?>
