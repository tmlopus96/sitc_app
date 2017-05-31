<?php

  require_once 'sitc_workforce_creds.php';

  $connection = new mysqli($hostname, $username, $password, $database);
  if ($connection->connect_error)
    die ($connection->connect_error);

  $personId = (isset($_GET['personId'])) ? sanitize($_GET['personId']) : null;

  if ($personId) {
    $query = "DELETE FROM CheckedIn WHERE person_id=$personId";
    $result = $connection->query($query);

    if ($connection->error) {
      http_response_code(420);
      die ($connection->error);
    }
    else {
      echo 'success!';
    }
  }

?>

<?php
 function sanitize($var) {
   $clean_var = filter_var($var, FILTER_SANITIZE_STRING);
   return $clean_var;
 }
?>
