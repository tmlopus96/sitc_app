<?php

  require_once 'sitc_workforce_creds.php';

  $connection = new mysqli($hostname, $username, $password, $database);
  if ($connection->connect_error)
    die ($connection->connect_error);

  $person_id = (isset($_GET['person_id'])) ? sanitize($_GET['person_id']) : '';
  $dbTable = (isset($_GET['dbTable'])) ? sanitize($_GET['dbTable']) : '';

  if (!isset($_GET['param'])) {
    http_response_code(420);
    exit('No specified parameter to update');
  }
  else {
    $param = $_GET['param'];
    $value = (isset($_GET['value'])) ? $_GET['value'] : 'NULL';
  }

  $updateClause = "$param=";

  switch ($param) {
    case 'firstName':
      $updateClause .= "'$value'";
      break;
    case 'lastName':
      $updateClause .= "'$value'";
      break;
    case 'hasCar':
      $updateClause .= $value;
      break;
    case 'numSeatbelts':
      $updateClause .= $value;
      break;
    case 'primaryCarpool_id':
      $updateClause .= "'$value'";
      break;
    case 'paymentMethod':
      $updateClause .= "'$value'";
      break;
    case 'paymentStatus':
      $updateClause .= $value;
      break;
    case 'checkNumber':
      $updateClause .= $value;
      break;
  }

  $query = "UPDATE $dbTable SET $updateClause WHERE person_id=$person_id";
  echo $query;
  $result = $connection->query($query);

  if (!$result) {
    die ($connection->error);
  }

  if ($result) {
    echo "success";
  } else {
    http_response_code(500);
    exit('serverFail');
  }

?>

<?php
   function sanitize($var) {
     $clean_var = filter_var($var, FILTER_SANITIZE_STRING);
     return $clean_var;
   }
?>
